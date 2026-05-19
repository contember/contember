import { ConditionBlock, EvaluationContext, PolicySource, Statement, substituteValue } from '@contember/policy'
import { DatabaseContext } from '../utils'
import { IdentityPolicyAssignmentsQuery, PoliciesByIdsQuery } from './queries'
import { BUILTIN_POLICIES } from './builtinPolicies'

interface IdentityInput {
	id: string
	roles: readonly string[]
}

/**
 * Provides policy statements for an identity, combining:
 *   1. built-in policies (from `builtinPolicies.ts` in code) whose `role`
 *      matches one of `identity.roles` — no DB roundtrip needed
 *   2. policies explicitly assigned via `identity_policy` (user-defined,
 *      stored in `tenant_policy`)
 *
 * Assignment tags are baked into each statement at load time — so a single
 * shared policy attached to two identities with different `{team: ...}` tags
 * yields distinct effective statements. Within a statement, `${assignment.tags.X}`
 * substitutes the per-assignment value; other placeholders (`${identity.id}`,
 * `${subject.role}`) are resolved by the engine against the request context.
 */
export class TenantDbPolicyProvider implements PolicySource {
	public readonly name = 'tenant-db'

	/**
	 * Memoizes the statement list for the lifetime of the provider instance.
	 * The provider is created per request (in `PermissionContextFactory`), so
	 * this cache scopes naturally to one request: the DB roundtrip fires at
	 * most once even if the resolver calls `requireAction` repeatedly.
	 */
	private cached?: Promise<readonly Statement[]>

	constructor(
		private readonly dbContext: DatabaseContext,
		private readonly identity: IdentityInput,
	) {}

	getStatements(_context: EvaluationContext): Promise<readonly Statement[]> {
		if (!this.cached) {
			this.cached = this.loadStatements()
		}
		return this.cached
	}

	private async loadStatements(): Promise<readonly Statement[]> {
		const out: Statement[] = []

		// Built-ins live in code; no DB lookup.
		for (const builtin of BUILTIN_POLICIES) {
			if (this.identity.roles.includes(builtin.role)) {
				for (const stmt of builtin.document.statements) {
					out.push(stmt)
				}
			}
		}

		const assignments = await this.dbContext.queryHandler.fetch(
			new IdentityPolicyAssignmentsQuery(this.identity.id),
		)
		if (assignments.length === 0) {
			return out
		}

		const assignedPolicies = await this.dbContext.queryHandler.fetch(
			new PoliciesByIdsQuery(assignments.map(a => a.policyId)),
		)
		const assignedById = new Map(assignedPolicies.map(p => [p.id, p]))

		for (const assignment of assignments) {
			const policy = assignedById.get(assignment.policyId)
			if (!policy) continue
			const tagContext = { assignment: { tags: assignment.tags, policySlug: policy.slug } }
			for (const stmt of policy.document.statements) {
				out.push(bakeAssignmentTags(stmt, tagContext))
			}
		}
		return out
	}
}

/**
 * Pre-substitute `${assignment.tags.X}` placeholders into actions, resources,
 * and condition values using the assignment's tag bag. Remaining placeholders
 * are left intact for engine-time resolution.
 */
function bakeAssignmentTags(stmt: Statement, tagContext: EvaluationContext): Statement {
	const actions = stmt.actions.map(a => substituteValue(a, tagContext) as string)
	const resources = stmt.resources?.map(r => substituteValue(r, tagContext) as string)
	let conditions: ConditionBlock | undefined = stmt.conditions
	if (conditions) {
		const baked: ConditionBlock = {}
		for (const [op, paths] of Object.entries(conditions)) {
			const inner: Record<string, unknown> = {}
			for (const [path, value] of Object.entries(paths)) {
				inner[path] = substituteValue(value, tagContext)
			}
			;(baked as Record<string, unknown>)[op] = inner
		}
		conditions = baked
	}
	return {
		effect: stmt.effect,
		actions,
		resources,
		conditions,
	}
}
