import { CliError, ExitCode, type JsonValue } from '@contember/cli-common'
import type { WorkloadIdentityTrustInput } from '@contember/graphql-client-tenant'
import type { TenantWorkloadIdentityConfig, TenantWorkloadIdentityProfile } from '../tenantConfig.js'
import { type RemoteWorkloadIdentityTrust, toApiWorkloadProfile, toJsonValue } from './model.js'

/** Mirrors the server's profile defaults, so an unchanged block compares equal to what the server stored. */
const profileDefaults: Readonly<
	Record<TenantWorkloadIdentityProfile, { readonly signingAlgs: readonly string[]; readonly acceptedTyp: readonly (string | null)[] }>
> = {
	'oidc': { signingAlgs: ['RS256', 'ES256'], acceptedTyp: ['JWT', null] },
	'github-actions': { signingAlgs: ['RS256'], acceptedTyp: ['JWT'] },
}

const DEFAULT_MAX_TOKEN_LIFETIME = 3600

/**
 * The canonical form both sides are compared in: defaults filled in, set-like lists sorted, conditions and
 * memberships as canonical JSON strings. Order-only differences therefore never issue a mutation.
 */
export interface CanonicalWorkloadTrust {
	readonly profile: TenantWorkloadIdentityProfile
	readonly issuer: string
	readonly audience: string
	readonly jwksUri: string | null
	readonly signingAlgs: readonly string[]
	readonly acceptedTyp: readonly (string | null)[]
	readonly conditions: readonly string[]
	readonly acceptAudienceArray: boolean
	readonly requireDpop: boolean
	readonly maxTokenLifetime: number
	readonly trustForwardedInfo: boolean
	readonly description: string | null
	readonly roles: readonly string[]
	readonly memberships: readonly string[]
	readonly disabled: boolean
}

/** Fields that select *who* the trust admits; changing one (or re-enabling) rejects every earlier token (§10.9). */
const principalSelectionFields = [
	'profile',
	'issuer',
	'audience',
	'jwksUri',
	'signingAlgs',
	'acceptedTyp',
	'acceptAudienceArray',
	'conditions',
] as const

export type WorkloadIdentityChange = 'create' | 'update' | 'disable' | 'unchanged'

export interface WorkloadIdentityPlanStep {
	readonly slug: string
	readonly change: WorkloadIdentityChange
	/** True when the apply moves `tokensValidAfter`: tokens issued before it are rejected. */
	readonly rejectsEarlierTokens: boolean
	/**
	 * What to send: `apply` carries the whole definition, `disable` calls the disable mutation.
	 * `null` for `unchanged`.
	 */
	readonly mutation:
		| { readonly type: 'apply'; readonly input: WorkloadIdentityTrustInput }
		| { readonly type: 'disable' }
		| null
}

export interface WorkloadIdentityRename {
	readonly from: string
	readonly to: string
}

export interface WorkloadIdentityPlan {
	/** Disables first, then creates and updates — a renamed trust frees its (issuer, audience) before the new slug claims it. */
	readonly steps: readonly WorkloadIdentityPlanStep[]
	readonly renames: readonly WorkloadIdentityRename[]
}

const compareCanonical = (a: string | null, b: string | null): number => {
	if (a === b) {
		return 0
	}
	if (a === null) {
		return -1
	}
	if (b === null) {
		return 1
	}
	return a < b ? -1 : 1
}

// The server de-duplicates set-like lists before storing them (`validateTrustDefinition`), so the plan must too.
const sortedStrings = (values: readonly string[]): string[] => [...new Set(values)].sort(compareCanonical)

const sortedNullableStrings = (values: readonly (string | null)[]): (string | null)[] => [...new Set(values)].sort(compareCanonical)

/** JSON with sorted object keys. */
const canonicalJson = (value: JsonValue): string => {
	if (Array.isArray(value)) {
		return `[${value.map(canonicalJson).join(',')}]`
	}
	if (value !== null && typeof value === 'object') {
		const entries = Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
		return `{${entries.join(',')}}`
	}
	return JSON.stringify(value)
}

/** `in` operands are a set; `path` segments are an ordered key path and stay as they are. */
const canonicalCondition = (condition: JsonValue): string => {
	if (condition !== null && typeof condition === 'object' && !Array.isArray(condition)) {
		const operand = condition.in
		if (Array.isArray(operand)) {
			const operands = [...new Map(operand.map(it => [canonicalJson(it), it])).entries()]
			return canonicalJson({ ...condition, in: operands.sort(([a], [b]) => compareCanonical(a, b)).map(([, it]) => it) })
		}
	}
	return canonicalJson(condition)
}

const canonicalConditions = (conditions: JsonValue): string[] =>
	Array.isArray(conditions) ? sortedStrings(conditions.map(canonicalCondition)) : [canonicalJson(conditions)]

interface MembershipLike {
	readonly project: string
	readonly role: string
	readonly variables?: readonly { readonly name: string; readonly values: readonly string[] }[]
	readonly assumeMembership?: unknown
}

const canonicalMembership = (membership: MembershipLike): string =>
	canonicalJson({
		project: membership.project,
		role: membership.role,
		variables: [...(membership.variables ?? [])]
			.sort((a, b) => compareCanonical(a.name, b.name))
			.map(it => ({ name: it.name, values: sortedStrings(it.values) })),
		assumeMembership: toJsonValue(membership.assumeMembership) ?? null,
	})

const toJsonList = (conditions: TenantWorkloadIdentityConfig['conditions']): JsonValue => toJsonValue(conditions) ?? null

export const canonicalizeConfig = (config: TenantWorkloadIdentityConfig): CanonicalWorkloadTrust => {
	const defaults = profileDefaults[config.profile]
	return {
		profile: config.profile,
		issuer: config.issuer,
		audience: config.audience,
		jwksUri: config.jwksUri ?? null,
		signingAlgs: sortedStrings(config.signingAlgs ?? defaults.signingAlgs),
		acceptedTyp: sortedNullableStrings(config.typ ?? defaults.acceptedTyp),
		conditions: canonicalConditions(toJsonList(config.conditions)),
		acceptAudienceArray: config.acceptAudienceArray ?? false,
		requireDpop: config.requireDpop ?? false,
		maxTokenLifetime: config.maxTokenLifetime ?? DEFAULT_MAX_TOKEN_LIFETIME,
		trustForwardedInfo: config.trustForwardedInfo ?? false,
		// the server stores an empty description as null
		description: config.description === undefined || config.description === '' ? null : config.description,
		roles: sortedStrings(config.roles ?? []),
		memberships: (config.memberships ?? []).map(canonicalMembership).sort(),
		disabled: config.disabled ?? false,
	}
}

export const canonicalizeRemote = (trust: RemoteWorkloadIdentityTrust): CanonicalWorkloadTrust => ({
	profile: trust.profile,
	issuer: trust.issuer,
	audience: trust.audience,
	jwksUri: trust.jwksUri,
	signingAlgs: sortedStrings(trust.signingAlgs),
	acceptedTyp: sortedNullableStrings(trust.acceptedTyp),
	conditions: canonicalConditions(trust.conditions),
	acceptAudienceArray: trust.acceptAudienceArray,
	requireDpop: trust.requireDpop,
	maxTokenLifetime: trust.maxTokenLifetime,
	trustForwardedInfo: trust.trustForwardedInfo,
	description: trust.description,
	roles: sortedStrings(trust.roles),
	memberships: trust.memberships.map(canonicalMembership).sort(),
	disabled: trust.disabled,
})

const sameValue = (a: CanonicalWorkloadTrust[keyof CanonicalWorkloadTrust], b: CanonicalWorkloadTrust[keyof CanonicalWorkloadTrust]): boolean =>
	JSON.stringify(a) === JSON.stringify(b)

const changedFields = (current: CanonicalWorkloadTrust, desired: CanonicalWorkloadTrust): (keyof CanonicalWorkloadTrust)[] => {
	const fields: (keyof CanonicalWorkloadTrust)[] = [
		'profile',
		'issuer',
		'audience',
		'jwksUri',
		'signingAlgs',
		'acceptedTyp',
		'conditions',
		'acceptAudienceArray',
		'requireDpop',
		'maxTokenLifetime',
		'trustForwardedInfo',
		'description',
		'roles',
		'memberships',
		'disabled',
	]
	return fields.filter(field => !sameValue(current[field], desired[field]))
}

/** The whole definition, defaults filled in — `applyWorkloadIdentityTrust` replaces, it does not merge. */
export const toTrustInput = (config: TenantWorkloadIdentityConfig): WorkloadIdentityTrustInput => {
	const defaults = profileDefaults[config.profile]
	return {
		profile: toApiWorkloadProfile(config.profile),
		issuer: config.issuer,
		audience: config.audience,
		conditions: config.conditions,
		jwksUri: config.jwksUri ?? null,
		signingAlgs: config.signingAlgs ?? defaults.signingAlgs,
		acceptedTyp: config.typ ?? defaults.acceptedTyp,
		acceptAudienceArray: config.acceptAudienceArray ?? false,
		requireDpop: config.requireDpop ?? false,
		maxTokenLifetime: config.maxTokenLifetime ?? DEFAULT_MAX_TOKEN_LIFETIME,
		trustForwardedInfo: config.trustForwardedInfo ?? false,
		description: config.description ?? null,
		roles: config.roles ?? [],
		memberships: (config.memberships ?? []).map(membership => ({
			project: membership.project,
			role: membership.role,
			variables: membership.variables ?? [],
			assumeMembership: membership.assumeMembership ?? null,
		})),
		disabled: config.disabled ?? false,
	}
}

const addressKey = (trust: { readonly issuer: string; readonly audience: string }): string => JSON.stringify([trust.issuer, trust.audience])

/** Enabled trusts must have distinct (issuer, audience) — checked before anything is written. */
const assertDistinctAddresses = (desired: Readonly<Record<string, TenantWorkloadIdentityConfig>>): void => {
	const slugsByAddress = new Map<string, string[]>()
	for (const [slug, trust] of Object.entries(desired)) {
		if (trust.disabled === true) {
			continue
		}
		const key = addressKey(trust)
		slugsByAddress.set(key, [...(slugsByAddress.get(key) ?? []), slug])
	}
	const conflicts = [...slugsByAddress.values()].filter(slugs => slugs.length > 1)
	if (conflicts.length > 0) {
		throw new CliError(
			`Workload identity trusts ${conflicts.map(slugs => slugs.join(' and ')).join('; ')} share the same issuer and audience. `
				+ 'Enabled trusts must differ in (issuer, audience); give each its own audience.',
			{
				code: 'WORKLOAD_IDENTITY_AUDIENCE_CONFLICT',
				exitCode: ExitCode.InputError,
				details: { conflicts },
			},
		)
	}
}

/**
 * Reconciles a present `workloadIdentities` block against the listed trusts. The block is authoritative:
 * a listed trust it does not name is disabled. Call it only when the block is present — an absent block
 * leaves the trusts unmanaged.
 */
export const planWorkloadIdentities = (
	desired: Readonly<Record<string, TenantWorkloadIdentityConfig>>,
	existing: readonly RemoteWorkloadIdentityTrust[],
): WorkloadIdentityPlan => {
	assertDistinctAddresses(desired)
	const existingBySlug = new Map(existing.map(it => [it.slug, it]))
	const disables: WorkloadIdentityPlanStep[] = []
	const upserts: WorkloadIdentityPlanStep[] = []
	const unchanged: WorkloadIdentityPlanStep[] = []
	const disabledAddresses = new Map<string, string>()
	const createdAddresses: { readonly slug: string; readonly key: string }[] = []

	for (const trust of existing) {
		if (!(trust.slug in desired)) {
			if (trust.disabled) {
				unchanged.push({ slug: trust.slug, change: 'unchanged', rejectsEarlierTokens: false, mutation: null })
			} else {
				disables.push({ slug: trust.slug, change: 'disable', rejectsEarlierTokens: false, mutation: { type: 'disable' } })
				disabledAddresses.set(addressKey(trust), trust.slug)
			}
		}
	}

	for (const [slug, config] of Object.entries(desired)) {
		const current = existingBySlug.get(slug)
		const target = canonicalizeConfig(config)
		if (current === undefined) {
			upserts.push({ slug, change: 'create', rejectsEarlierTokens: false, mutation: { type: 'apply', input: toTrustInput(config) } })
			if (!target.disabled) {
				createdAddresses.push({ slug, key: addressKey(config) })
			}
			continue
		}
		const changed = changedFields(canonicalizeRemote(current), target)
		if (changed.length === 0) {
			unchanged.push({ slug, change: 'unchanged', rejectsEarlierTokens: false, mutation: null })
			continue
		}
		if (target.disabled && current.disabled) {
			// an edited tombstone: the trust stays disabled, so no earlier token becomes valid or invalid
			upserts.push({ slug, change: 'update', rejectsEarlierTokens: false, mutation: { type: 'apply', input: toTrustInput(config) } })
			continue
		}
		if (target.disabled) {
			const onlyDisabling = changed.length === 1 && changed[0] === 'disabled'
			disables.push({
				slug,
				change: 'disable',
				rejectsEarlierTokens: false,
				mutation: onlyDisabling ? { type: 'disable' } : { type: 'apply', input: toTrustInput(config) },
			})
			disabledAddresses.set(addressKey(current), slug)
			continue
		}
		const reEnabled = current.disabled
		const selectionChanged = changed.some(field => principalSelectionFields.some(it => it === field))
		upserts.push({
			slug,
			change: 'update',
			rejectsEarlierTokens: reEnabled || selectionChanged,
			mutation: { type: 'apply', input: toTrustInput(config) },
		})
	}

	const renames = createdAddresses.flatMap(({ slug, key }) => {
		const from = disabledAddresses.get(key)
		return from === undefined ? [] : [{ from, to: slug }]
	})

	return { steps: [...disables, ...upserts, ...unchanged], renames }
}
