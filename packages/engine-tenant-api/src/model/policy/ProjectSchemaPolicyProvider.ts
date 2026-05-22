import { Acl } from '@contember/schema'
import { EvaluationContext, PolicySource, Statement } from '@contember/policy'
import { TenantActions, TenantResources } from './actions'
import { statementsForMembershipRule } from './membershipRuleStatements'

/**
 * Translate `Acl.Membership` (array-of-`{name, values}`) into the engine
 * subject shape that `ProjectSchemaPolicyProvider`'s statements expect:
 *
 *   { role, variables: { [varName]: values } }
 *
 * Callers MUST use this when populating `subject.membership` for
 * `isAllowedAction` / `requireAction`; passing the raw `Acl.Membership` will
 * cause `forAllValues:stringEquals` checks to read `undefined` (vacuous true)
 * and broaden permissions beyond what the membership-rule statements would
 * otherwise allow.
 */
export function buildMembershipSubject(membership: Acl.Membership): {
	role: string
	variables: Record<string, readonly string[]>
} {
	const variables: Record<string, readonly string[]> = {}
	for (const v of membership.variables) {
		variables[v.name] = v.values
	}
	return { role: membership.role, variables }
}

interface ProjectScopeInput {
	slug: string
	acl: Acl.Schema
	memberships: readonly Acl.Membership[]
}

/**
 * Translates the per-project schema-level tenant ACL (`acl.roles[*].tenant`)
 * into policy statements at request time.
 *
 * For each invoker membership, the schema's `MembershipMatchRule` for that
 * role becomes one or more allow statements scoped to actions on members in
 * this project. This is the policy-engine equivalent of the legacy
 * `AclSchemaAccessNodeFactory`.
 *
 * Behavior:
 *   - Outer gate: an action is allowable only if ANY invoker role has the
 *     governing field truthy (`tenant.invite`, `tenant.unmanagedInvite`,
 *     `tenant.manage`, `tenant.view`).
 *   - Per-invoker mapping: when the gate passes, EVERY invoker membership
 *     contributes a statement based on its own role's rule mapping — even
 *     memberships whose role doesn't itself set the field. Decisions union
 *     across all invoker memberships.
 *   - For `invite`/`unmanagedInvite`: the effective per-role rule is
 *     `(field is an object) ? field : (manage ?? {})`. So a role with
 *     `invite: true, manage: undefined` is mapped to the empty rule `{}`,
 *     which matches no subject (DENIES) — NOT to an unconditional allow.
 */
export class ProjectSchemaPolicyProvider implements PolicySource {
	public readonly name = 'project-schema'

	constructor(private readonly project: ProjectScopeInput) {}

	getStatements(_context: EvaluationContext): readonly Statement[] {
		const out: Statement[] = []
		const resource = TenantResources.project(this.project.slug)
		const memberships = this.project.memberships
		const acl = this.project.acl

		const tenantByMembership = memberships.map(invoker => ({
			invoker,
			tenant: acl.roles[invoker.role]?.tenant,
		}))

		const inviteEnabled = tenantByMembership.some(({ tenant }) => !!tenant?.invite)
		const unmanagedInviteEnabled = tenantByMembership.some(({ tenant }) => !!tenant?.unmanagedInvite)
		const manageEnabled = tenantByMembership.some(({ tenant }) => !!tenant?.manage)
		const viewEnabled = tenantByMembership.some(({ tenant }) => !!tenant?.view)

		// Coarse-gate statements. Resolvers do a two-step check: first a "can you
		// manage members here at all?" probe with an EMPTY subject-membership list
		// (no `subject.membership` in context), then a per-membership check. The
		// legacy verifier was `memberships.every(matcher.matches)`, so the empty
		// probe returned `true` for any invoker whose role merely *had* the
		// capability — even a non-admin delegated manager. The per-membership
		// statements below all carry a `subject.membership.role` condition, which
		// is missing during the probe and fail-closes to deny, silently stripping
		// delegated managers/viewers of member access. These gate statements
		// restore the legacy probe: `exists:{subject.membership:false}` makes them
		// apply ONLY when no membership is in context (the probe), and be skipped
		// during the real per-membership evaluation.
		const probeOnly = { exists: { 'subject.membership': false } } as const
		if (inviteEnabled) {
			out.push({ effect: 'allow', actions: [TenantActions.personInvite], resources: [resource], conditions: probeOnly })
		}
		if (unmanagedInviteEnabled) {
			out.push({ effect: 'allow', actions: [TenantActions.personInviteUnmanaged], resources: [resource], conditions: probeOnly })
		}
		if (manageEnabled) {
			out.push({
				effect: 'allow',
				actions: [
					TenantActions.projectViewMember,
					TenantActions.projectAddMember,
					TenantActions.projectUpdateMember,
					TenantActions.projectRemoveMember,
				],
				resources: [resource],
				conditions: probeOnly,
			})
		}
		if (viewEnabled) {
			out.push({ effect: 'allow', actions: [TenantActions.projectViewMember], resources: [resource], conditions: probeOnly })
		}

		for (const { invoker, tenant } of tenantByMembership) {
			if (!tenant) continue

			if (inviteEnabled) {
				out.push(...statementsForMembershipRule(
					invoker,
					effectiveInviteRule(tenant.invite, tenant.manage),
					[TenantActions.personInvite],
					resource,
				))
			}
			if (unmanagedInviteEnabled) {
				out.push(...statementsForMembershipRule(
					invoker,
					effectiveInviteRule(tenant.unmanagedInvite, tenant.manage),
					[TenantActions.personInviteUnmanaged],
					resource,
				))
			}
			if (manageEnabled) {
				out.push(...statementsForMembershipRule(
					invoker,
					tenant.manage ?? {},
					[
						TenantActions.projectViewMember,
						TenantActions.projectAddMember,
						TenantActions.projectUpdateMember,
						TenantActions.projectRemoveMember,
					],
					resource,
				))
			}
			if (viewEnabled) {
				out.push(...statementsForMembershipRule(
					invoker,
					tenant.view ?? {},
					[TenantActions.projectViewMember],
					resource,
				))
			}
		}
		return out
	}
}

/**
 * Legacy mapper for invite/unmanagedInvite:
 *   `primary && primary !== true ? primary : (manage ?? {})`
 *
 * - primary is an object → use primary directly
 * - primary is `true | false | undefined` → fall back to `manage` (default to
 *   `{}` which matches no subject)
 */
function effectiveInviteRule(
	primary: Acl.MembershipMatchRule | undefined,
	manageFallback: Acl.MembershipMatchRule | undefined,
): Acl.MembershipMatchRule {
	if (primary && primary !== true) return primary
	return manageFallback ?? {}
}
