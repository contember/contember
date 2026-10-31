import { AuthCredential, MembershipMatcher, MembershipWithSubMembershipMatchRules } from '@contember/engine-tenant-api'
import * as Typesafe from '@contember/typesafe'
import { Acl } from '@contember/schema'
import { HttpErrorResponse } from '../common/index.js'
import { ProjectMembershipFetcher } from './ProjectMembershipFetcher.js'
import { getRoleVariables, MembershipResolver, ParsedMembership } from '@contember/schema-utils'

const assumeMembershipHeader = 'x-contember-assume-membership'

interface HttpRequest {
	body?: unknown
	get(header: string): string
}

export class ProjectMembershipResolver {
	constructor(
		private readonly debug: boolean,
		private readonly projectMembershipFetcher: ProjectMembershipFetcher,
	) {
	}

	public async resolveMemberships({ request, acl, projectSlug, identity }: {
		acl: Acl.Schema
		request: HttpRequest
		projectSlug: string
		identity: { identityId: string; personId?: string; roles?: readonly string[]; credential: AuthCredential }
	}): Promise<{ effective: readonly ParsedMembership[]; fetched: readonly Acl.Membership[] }> {
		const explicitMemberships = await this.projectMembershipFetcher.fetchMemberships(projectSlug, {
			id: identity.identityId,
			roles: identity.roles,
		})

		const implicitRoles = Object.entries(acl.roles).filter(([, role]) => role.implicit).map(([name]) => name)

		const throwNotAllowed = () => {
			const errorMessage = this.debug
				? `You are not allowed to access project ${projectSlug}`
				: `Project ${projectSlug} NOT found`
			throw new HttpErrorResponse(404, errorMessage)
		}

		if (explicitMemberships.length === 0 && implicitRoles.length === 0) {
			throwNotAllowed()
		}

		const membershipResolver = new MembershipResolver()

		const assumedMemberships = this.readAssumedMemberships(request)
		if (assumedMemberships !== null) {
			if (assumedMemberships.length === 0) {
				throwNotAllowed()
			}

			// §7a: the envelope answers first, so any assumption it does not cover is a 403, whatever else is wrong with it.
			if (identity.credential.type === 'workload_trust') {
				await this.verifyWorkloadAssumedRoles(identity.credential.trustId, projectSlug, acl, assumedMemberships)
			}
			const parsedMemberships = membershipResolver.resolve(acl, assumedMemberships, identity, true)
			if (parsedMemberships.errors.length > 0) {
				throw new HttpErrorResponse(
					400,
					`Invalid memberships in ${assumeMembershipHeader} header:\n`
						+ parsedMemberships.errors.map(it => JSON.stringify(it)).join('\n'),
				)
			}
			if (identity.credential.type !== 'workload_trust') {
				this.verifyAssumedRoles(explicitMemberships, acl, assumedMemberships)
			}

			return { effective: parsedMemberships.memberships, fetched: explicitMemberships }
		}

		const explicitProjectRoles = explicitMemberships.map(it => it.role)
		const implicitMemberships = implicitRoles
			.filter(it => !explicitProjectRoles.includes(it))
			.map((role): Acl.Membership => ({ role, variables: [] }))

		return {
			// intentionally ignoring validation errors of stored memberships
			effective: membershipResolver.resolve(acl, [...explicitMemberships, ...implicitMemberships], identity, false).memberships,
			fetched: explicitMemberships,
		}
	}

	private readAssumedMemberships(req: HttpRequest): null | readonly Acl.Membership[] {
		const value = this.readAssumeMembershipJson(req)
		if (value === null) {
			return null
		}
		try {
			return assumeMembershipValueType(value).memberships
		} catch (e: any) {
			throw new HttpErrorResponse(400, `Invalid format of "assume membership": ${e.message}`)
		}
	}

	private readAssumeMembershipJson(req: HttpRequest): unknown {
		if (typeof req.body === 'object' && req.body !== null && 'assumeMembership' in req.body) {
			return (req.body as any).assumeMembership
		}
		const value = req.get(assumeMembershipHeader).trim()
		return value !== '' ? JSON.parse(value) : null
	}

	private verifyAssumedRoles(explicitMemberships: readonly Acl.Membership[], acl: Acl.Schema, assumedMemberships: readonly Acl.Membership[]) {
		const membershipMatcher = new MembershipMatcher(explicitMemberships.flatMap(it => {
			const role = findRole(acl, it.role)
			return role ? [{ ...it, matchRule: role.content?.assumeMembership ?? {} }] : []
		}))

		for (const assumed of assumedMemberships) {
			if (!membershipMatcher.matches(assumed)) {
				throw createAssumeForbiddenError(assumed)
			}
		}
	}

	/**
	 * §7a: the trust's envelope is the only assumption authority. Each source membership carries only its own rule,
	 * and the matching rule must cover every non-predefined variable of the assumed role with caller-supplied values.
	 */
	private async verifyWorkloadAssumedRoles(trustId: string, projectSlug: string, acl: Acl.Schema, assumedMemberships: readonly Acl.Membership[]) {
		const rules = await this.projectMembershipFetcher.fetchWorkloadAssumeRules(projectSlug, trustId)
		const sources: MembershipWithSubMembershipMatchRules[] = rules
			.filter(it => findRole(acl, it.membership.role) !== undefined)
			.map(it => ({ ...it.membership, matchRule: it.rule }))

		for (const assumed of assumedMemberships) {
			const allowed = sources.some(source => new MembershipMatcher([source]).matches(assumed) && coversRoleVariables(source.matchRule, assumed, acl))
			if (!allowed) {
				throw createAssumeForbiddenError(assumed)
			}
		}
	}
}

const findRole = (acl: Acl.Schema, role: string): Acl.RolePermissions | undefined =>
	Object.prototype.hasOwnProperty.call(acl.roles, role) ? acl.roles[role] : undefined

const createAssumeForbiddenError = (assumed: Acl.Membership) =>
	new HttpErrorResponse(403, `You are not allow to assume membership ${JSON.stringify(assumed)}`)

/** The variables a rule names for a target role: `true` names every variable (unbounded), `undefined` none. */
const getNamedVariables = (
	matchRule: Acl.MembershipMatchRule,
	role: string,
): true | Readonly<Record<string, Acl.MembershipVariableMatchRule>> | undefined => {
	if (matchRule === true) {
		return true
	}
	if (matchRule === false || !Object.prototype.hasOwnProperty.call(matchRule, role)) {
		return undefined
	}
	const roleRule = matchRule[role]
	if (roleRule === true || roleRule.variables === true) {
		return true
	}
	return roleRule.variables ?? {}
}

/**
 * Without this, an omitted variable passes the matcher vacuously and the schema fallback widens it, also for a
 * variable added to the role after the rule was written. Predefined variables always derive from the trust identity.
 */
const coversRoleVariables = (matchRule: Acl.MembershipMatchRule, assumed: Acl.Membership, acl: Acl.Schema): boolean => {
	const namedVariables = getNamedVariables(matchRule, assumed.role)
	if (namedVariables === undefined) {
		return false
	}
	for (const [name, variable] of Object.entries(getRoleVariables(assumed.role, acl))) {
		const supplied = assumed.variables.find(it => it.name === name)
		if (variable.type === Acl.VariableType.predefined) {
			if (supplied !== undefined) {
				return false
			}
			continue
		}
		const named = namedVariables === true || (Object.prototype.hasOwnProperty.call(namedVariables, name) && !!namedVariables[name])
		if (!named || supplied === undefined || supplied.values.length === 0) {
			return false
		}
	}
	return true
}

const assumeMembershipValueType = Typesafe.object({
	memberships: Typesafe.array(
		Typesafe.object({
			role: Typesafe.string,
			variables: Typesafe.array(
				Typesafe.object({
					name: Typesafe.string,
					values: Typesafe.array(Typesafe.string),
				}),
			),
		}),
	),
})
