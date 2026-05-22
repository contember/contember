import { DatabaseContext } from '../utils'
import { AllProjectRolesByIdentityQuery, AuthPoliciesQuery } from '../queries'
import { AuthPolicyRow, EffectivePolicy } from '../type'
import { IPostgresInterval } from 'postgres-interval'
import { intervalToSeconds } from '../utils/interval'

/**
 * Resolves the effective auth policy for an identity by aggregating all matching
 * `auth_policy` rows across the identity's entire role set (global roles + every
 * project-membership role across all projects).
 *
 * Shared by A06 (consumes `mfaRequired`) and A19 (consumes the session fields).
 *
 * Aggregation:
 * - `mfaRequired` = OR of every matched row's `mfa_required` (NULL = no opinion).
 * - session fields = strictest wins: the shortest `tokenExpiration` / `idleTimeout`
 *   and the logical AND of `rememberMeAllowed` (any matched `false` wins).
 *
 * When nothing matches, the result is the inert baseline
 * (`mfaRequired=false`, session fields null) — i.e. today's behavior.
 */
export class AuthPolicyResolver {
	async resolveForIdentity(db: DatabaseContext, identityId: string, globalRoles: readonly string[]): Promise<EffectivePolicy> {
		const policies = await db.queryHandler.fetch(new AuthPoliciesQuery())
		// Fast path: with no policies configured, enforcement is inert and we skip
		// the cross-project role query entirely (preserves today's query shape).
		if (policies.length === 0) {
			return { mfaRequired: false, tokenExpiration: null, idleTimeout: null, graceDuration: null, rememberMeAllowed: null }
		}
		const projectRoles = await db.queryHandler.fetch(new AllProjectRolesByIdentityQuery(identityId))

		// Map of project_id -> set of roles held in that project.
		const rolesByProject = new Map<string, Set<string>>()
		for (const { projectId, role } of projectRoles) {
			let set = rolesByProject.get(projectId)
			if (!set) {
				set = new Set<string>()
				rolesByProject.set(projectId, set)
			}
			set.add(role)
		}

		const globalRoleSet = new Set(globalRoles)

		const matched = policies.filter(policy => this.matches(policy, globalRoleSet, rolesByProject))

		return this.aggregate(matched)
	}

	private matches(policy: AuthPolicyRow, globalRoles: Set<string>, rolesByProject: Map<string, Set<string>>): boolean {
		if (policy.scope === 'global') {
			return policy.roles.some(role => globalRoles.has(role))
		}
		if (policy.scope === 'project') {
			if (policy.project_id === null) {
				return false
			}
			const projectRoles = rolesByProject.get(policy.project_id)
			if (!projectRoles) {
				return false
			}
			return policy.roles.some(role => projectRoles.has(role))
		}
		return false
	}

	private aggregate(policies: readonly AuthPolicyRow[]): EffectivePolicy {
		let mfaRequired = false
		let tokenExpiration: IPostgresInterval | null = null
		let idleTimeout: IPostgresInterval | null = null
		let graceDuration: IPostgresInterval | null = null
		let rememberMeAllowed: boolean | null = null

		for (const policy of policies) {
			if (policy.mfa_required === true) {
				mfaRequired = true
			}
			tokenExpiration = this.shortest(tokenExpiration, policy.token_expiration)
			idleTimeout = this.shortest(idleTimeout, policy.idle_timeout)
			graceDuration = this.shortest(graceDuration, policy.grace_duration)
			if (policy.remember_me_allowed === false) {
				rememberMeAllowed = false
			} else if (policy.remember_me_allowed === true && rememberMeAllowed === null) {
				rememberMeAllowed = true
			}
		}

		return { mfaRequired, tokenExpiration, idleTimeout, graceDuration, rememberMeAllowed }
	}

	/** Strictest wins: returns the shorter of two intervals (NULL = unconstrained). */
	private shortest(current: IPostgresInterval | null, candidate: IPostgresInterval | null): IPostgresInterval | null {
		if (candidate === null) {
			return current
		}
		if (current === null) {
			return candidate
		}
		return intervalToSeconds(candidate) < intervalToSeconds(current) ? candidate : current
	}
}
