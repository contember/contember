import { Acl, JSONValue } from '@contember/schema'
import { WorkloadIdentity } from '../../../type/index.js'
import { TenantRole } from '../../../authorization/Roles.js'
import { WorkloadTrustValues } from '../../../commands/workloadIdentity/WorkloadTrustValues.js'
import { validateConditionsForProfile } from '../conditions.js'
import { ASYMMETRIC_SIGNING_ALGS, DEDICATED_PROFILE_ISSUERS, DEFAULT_MAX_TOKEN_LIFETIME_SECONDS, workloadProfiles } from '../profiles.js'
import { ApplyResponse, createApplyError } from './applyErrors.js'
import { ResponseOk } from '../../../utils/Response.js'

export interface CanonicalMembershipDefinition extends Acl.Membership {
	readonly project: string
	readonly assumeMembership: Acl.MembershipMatchRule | null
}

/** A validated trust definition with every default filled in; conditions keep their declared order. */
export interface CanonicalTrustDefinition extends WorkloadTrustValues {
	readonly description: string | null
	/** Sorted, unique. */
	readonly roles: readonly string[]
	/** Sorted by project and role; variable names and values sorted. */
	readonly memberships: readonly CanonicalMembershipDefinition[]
}

/** Tenant roles that make the identity implicit project admin everywhere, ignoring stored memberships. */
const IMPLICIT_ADMIN_ROLES: ReadonlySet<string> = new Set([TenantRole.SUPER_ADMIN, TenantRole.PROJECT_ADMIN])

const compareStrings = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0

const sortedUnique = (values: readonly string[]): readonly string[] => [...new Set(values)].sort(compareStrings)

/** `null` (a missing `typ` header) sorts last. */
const sortedUniqueTyp = (values: readonly (string | null)[]): readonly (string | null)[] => {
	const strings = sortedUnique(values.filter((it): it is string => it !== null))
	return values.includes(null) ? [...strings, null] : strings
}

const sameSet = <T>(a: readonly T[], b: readonly T[]) => {
	const setA = new Set(a)
	const setB = new Set(b)
	return setA.size === setB.size && [...setA].every(it => setB.has(it))
}

const checkUrl = (
	field: string,
	value: string,
	instanceConfig: WorkloadIdentity.InstanceConfig,
): ApplyResponse<null> => {
	let url: URL
	try {
		url = new URL(value)
	} catch {
		return createApplyError('INVALID_DEFINITION', `\`${field}\` is not a valid URL`)
	}
	if (url.username !== '' || url.password !== '') {
		return createApplyError('INVALID_DEFINITION', `\`${field}\` must not carry credentials`)
	}
	if (url.protocol === 'https:') {
		return new ResponseOk(null)
	}
	const insecureHosts = new Set(instanceConfig.insecureIssuers.map(it => it.toLowerCase()))
	if (url.protocol === 'http:' && insecureHosts.has(url.hostname.toLowerCase())) {
		return new ResponseOk(null)
	}
	return createApplyError(
		'ISSUER_NOT_ALLOWED',
		`\`${field}\` must use https:// (plain http:// only for hosts listed in the instance's insecure issuers)`,
	)
}

const canonicalizeMemberships = (
	memberships: readonly WorkloadIdentity.MembershipDefinition[],
): ApplyResponse<readonly CanonicalMembershipDefinition[]> => {
	const errors: { project: string; role: string; message: string }[] = []
	const seen = new Set<string>()
	const result: CanonicalMembershipDefinition[] = []
	for (const membership of memberships) {
		const error = (message: string) => errors.push({ project: membership.project, role: membership.role, message })
		const key = JSON.stringify([membership.project, membership.role])
		if (seen.has(key)) {
			error('the role is declared more than once for this project')
			continue
		}
		seen.add(key)
		const variableNames = membership.variables.map(it => it.name)
		if (new Set(variableNames).size !== variableNames.length) {
			error('a variable is declared more than once')
			continue
		}
		// an empty value list would silently drop the whole membership row on write
		const empty = membership.variables.find(it => it.values.length === 0)
		if (empty) {
			error(`variable ${empty.name} has no values`)
			continue
		}
		result.push({
			project: membership.project,
			role: membership.role,
			variables: [...membership.variables]
				.sort((a, b) => compareStrings(a.name, b.name))
				.map(it => ({ name: it.name, values: sortedUnique(it.values) })),
			assumeMembership: membership.assumeMembership ?? null,
		})
	}
	if (errors.length > 0) {
		return createApplyError('INVALID_MEMBERSHIP', 'Invalid memberships', errors)
	}
	return new ResponseOk(result.sort((a, b) => compareStrings(a.project, b.project) || compareStrings(a.role, b.role)))
}

/**
 * The definition rules that need no database (§5, §6a, §9, §9a, §9b): issuer policy, profile constraints,
 * conditions, lifetime, tenant roles a trust may never carry and the implicit-membership trap.
 */
export const validateTrustDefinition = (
	definition: WorkloadIdentity.TrustDefinition,
	instanceConfig: WorkloadIdentity.InstanceConfig,
): ApplyResponse<CanonicalTrustDefinition> => {
	const profile = workloadProfiles[definition.profile]

	const issuerCheck = checkUrl('issuer', definition.issuer, instanceConfig)
	if (!issuerCheck.ok) {
		return issuerCheck
	}
	if (definition.jwksUri !== undefined) {
		const jwksCheck = checkUrl('jwksUri', definition.jwksUri, instanceConfig)
		if (!jwksCheck.ok) {
			return jwksCheck
		}
	}
	if (definition.profile === 'oidc') {
		const dedicated = Object.entries(DEDICATED_PROFILE_ISSUERS).find(([issuer]) => issuer === definition.issuer.replace(/\/+$/, ''))
		if (dedicated) {
			return createApplyError(
				'ISSUER_NOT_ALLOWED',
				`Issuer ${dedicated[0]} has a dedicated profile; use the ${dedicated[1]} profile instead of oidc`,
			)
		}
	}

	if (definition.audience.trim() === '') {
		return createApplyError('INVALID_DEFINITION', '`audience` must not be empty')
	}

	const conditionErrors = validateConditionsForProfile(definition.profile, definition.conditions)
	if (conditionErrors.length > 0) {
		return createApplyError(
			'INVALID_CONDITIONS',
			'Invalid conditions: ' + conditionErrors.map(it => it.message).join('; '),
			conditionErrors.map(({ index, message }): JSONValue => ({ index, message })),
		)
	}

	let signingAlgs: readonly string[]
	if (profile.fixedSigningAlgs !== null) {
		if (definition.signingAlgs !== undefined && !sameSet(definition.signingAlgs, profile.fixedSigningAlgs)) {
			return createApplyError(
				'INVALID_DEFINITION',
				`The ${definition.profile} profile fixes \`signingAlgs\` to ${profile.fixedSigningAlgs.join(', ')}`,
			)
		}
		signingAlgs = sortedUnique(profile.fixedSigningAlgs)
	} else {
		signingAlgs = sortedUnique(definition.signingAlgs ?? profile.defaultSigningAlgs)
		if (signingAlgs.length === 0) {
			return createApplyError('INVALID_DEFINITION', '`signingAlgs` must not be empty')
		}
		const invalid = signingAlgs.filter(it => !ASYMMETRIC_SIGNING_ALGS.includes(it))
		if (invalid.length > 0) {
			return createApplyError(
				'INVALID_DEFINITION',
				`\`signingAlgs\` allows only asymmetric algorithms (${ASYMMETRIC_SIGNING_ALGS.join(', ')}); got ${invalid.join(', ')}`,
			)
		}
	}

	let acceptedTyp: readonly (string | null)[]
	if (profile.fixedAcceptedTyp !== null) {
		if (definition.acceptedTyp !== undefined && !sameSet(definition.acceptedTyp, profile.fixedAcceptedTyp)) {
			return createApplyError(
				'INVALID_DEFINITION',
				`The ${definition.profile} profile fixes \`acceptedTyp\` to ${profile.fixedAcceptedTyp.map(it => it ?? 'null').join(', ')}`,
			)
		}
		acceptedTyp = sortedUniqueTyp(profile.fixedAcceptedTyp)
	} else {
		acceptedTyp = sortedUniqueTyp(definition.acceptedTyp ?? profile.defaultAcceptedTyp)
		if (acceptedTyp.length === 0) {
			return createApplyError('INVALID_DEFINITION', '`acceptedTyp` must not be empty')
		}
		if (acceptedTyp.includes('')) {
			return createApplyError('INVALID_DEFINITION', '`acceptedTyp` values must be non-empty strings or null')
		}
	}

	const acceptAudienceArray = definition.acceptAudienceArray ?? false
	if (acceptAudienceArray && !profile.allowsAudienceArray) {
		return createApplyError('INVALID_DEFINITION', `The ${definition.profile} profile does not allow \`acceptAudienceArray\``)
	}
	const requireDpop = definition.requireDpop ?? false
	if (requireDpop && !profile.allowsDpop) {
		return createApplyError('INVALID_DEFINITION', `The ${definition.profile} profile does not allow \`requireDpop\`: its tokens are never bound`)
	}

	const maxTokenLifetime = definition.maxTokenLifetime ?? DEFAULT_MAX_TOKEN_LIFETIME_SECONDS
	if (!Number.isInteger(maxTokenLifetime) || maxTokenLifetime <= 0 || maxTokenLifetime > profile.maxLifetimeSeconds) {
		return createApplyError(
			'INVALID_DEFINITION',
			`\`maxTokenLifetime\` must be a positive number of seconds, at most ${profile.maxLifetimeSeconds}`,
		)
	}

	const roles = sortedUnique(definition.roles)
	if (roles.includes(TenantRole.LOGIN)) {
		return createApplyError('ROLE_NOT_ALLOWED', `Role ${TenantRole.LOGIN} only enables person sign-in flows and cannot be granted to a trust`)
	}

	const memberships = canonicalizeMemberships(definition.memberships)
	if (!memberships.ok) {
		return memberships
	}
	const implicitAdminRole = roles.find(it => IMPLICIT_ADMIN_ROLES.has(it))
	if (implicitAdminRole !== undefined && memberships.result.length > 0) {
		return createApplyError(
			'IMPLICIT_MEMBERSHIP_CONFLICT',
			`Role ${implicitAdminRole} makes the trust an admin of every project, so its memberships and envelope would be ignored. `
				+ 'Split it into a trust with tenant roles only and a trust with memberships only.',
		)
	}

	return new ResponseOk({
		profile: definition.profile,
		issuer: definition.issuer,
		audience: definition.audience,
		jwksUri: definition.jwksUri ?? null,
		signingAlgs,
		acceptedTyp,
		acceptAudienceArray,
		requireDpop,
		conditions: definition.conditions,
		maxTokenLifetime,
		trustForwardedInfo: definition.trustForwardedInfo ?? false,
		disabled: definition.disabled,
		description: definition.description === undefined || definition.description === '' ? null : definition.description,
		roles,
		memberships: memberships.result,
	})
}

/** What decides which tokens a trust admits (§6): a change of it bumps `tokens_valid_after`. */
export interface PrincipalSelection {
	readonly profile: WorkloadIdentity.Profile
	readonly issuer: string
	readonly audience: string
	readonly jwksUri: string | null
	readonly signingAlgs: readonly string[]
	readonly acceptedTyp: readonly (string | null)[]
	readonly acceptAudienceArray: boolean
	readonly conditions: readonly WorkloadIdentity.Condition[]
}

const canonicalCondition = (condition: WorkloadIdentity.Condition): string => {
	const target = 'claim' in condition ? { claim: condition.claim } : { path: condition.path }
	const operator = 'equals' in condition
		? { equals: condition.equals }
		: 'in' in condition
		? {
			in: [...new Map(condition.in.map(it => [JSON.stringify(it), it])).entries()]
				.sort(([a], [b]) => compareStrings(a, b))
				.map(([, it]) => it),
		}
		: 'startsWith' in condition
		? { startsWith: condition.startsWith }
		: { arrayContains: condition.arrayContains }
	return JSON.stringify({ ...target, ...operator })
}

/** Canonical (sorted, de-duplicated) form of the principal selection; equal keys admit exactly the same tokens. */
export const principalSelectionKey = (selection: PrincipalSelection): string =>
	JSON.stringify({
		profile: selection.profile,
		issuer: selection.issuer,
		audience: selection.audience,
		jwksUri: selection.jwksUri,
		signingAlgs: sortedUnique(selection.signingAlgs),
		acceptedTyp: sortedUniqueTyp(selection.acceptedTyp),
		acceptAudienceArray: selection.acceptAudienceArray,
		conditions: sortedUnique(selection.conditions.map(canonicalCondition)),
	})
