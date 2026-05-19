import { Acl } from '@contember/schema'
import { ConditionBlock, EvaluationContext, PolicySource, Statement } from '@contember/policy'
import { TenantActions, TenantResources } from './actions'

/**
 * Translate `Acl.Membership` (array-of-`{name, values}`) into the engine
 * subject shape that `ProjectSchemaPolicyProvider`'s statements expect:
 *
 *   { role, variables: { [varName]: values } }
 *
 * Callers MUST use this when populating `subject.membership` for
 * `isAllowedAction` / `requireAction`; passing the raw `Acl.Membership` will
 * cause `forAllValues:stringEquals` checks to read `undefined` (vacuous true)
 * and broaden permissions beyond what `MembershipMatcher` would allow.
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
 * this project. This is the policy-engine equivalent of the existing
 * `AclSchemaAccessNodeFactory`.
 *
 * Mirrors legacy semantics precisely:
 *   - Outer gate: an action is allowable only if ANY invoker role has the
 *     governing field truthy (`tenant.invite`, `tenant.unmanagedInvite`,
 *     `tenant.manage`, `tenant.view`). Same as legacy's `membershipRoles.some(...)`
 *     check in `AclSchemaAccessNodeFactory.ts:23,28,33,41`.
 *   - Per-invoker mapping: when the gate passes, EVERY invoker membership
 *     contributes a statement based on its own role's rule mapping — even
 *     memberships whose role doesn't itself set the field. Legacy then unions
 *     across all memberships via `.some(...)` in `MembershipMatcher.matches`.
 *   - For `invite`/`unmanagedInvite`: the effective per-role rule is
 *     `(field is an object) ? field : (manage ?? {})`. So a role with
 *     `invite: true, manage: undefined` is mapped to the empty rule `{}`,
 *     which matches no subject (LEGACY DENIES) — NOT to an unconditional allow.
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

		for (const { invoker, tenant } of tenantByMembership) {
			if (!tenant) continue

			if (inviteEnabled) {
				appendStatementsForRule(
					out,
					resource,
					invoker,
					effectiveInviteRule(tenant.invite, tenant.manage),
					[TenantActions.personInvite],
				)
			}
			if (unmanagedInviteEnabled) {
				appendStatementsForRule(
					out,
					resource,
					invoker,
					effectiveInviteRule(tenant.unmanagedInvite, tenant.manage),
					[TenantActions.personInviteUnmanaged],
				)
			}
			if (manageEnabled) {
				appendStatementsForRule(
					out,
					resource,
					invoker,
					tenant.manage ?? {},
					[
						TenantActions.projectViewMember,
						TenantActions.projectAddMember,
						TenantActions.projectUpdateMember,
						TenantActions.projectRemoveMember,
					],
				)
			}
			if (viewEnabled) {
				appendStatementsForRule(
					out,
					resource,
					invoker,
					tenant.view ?? {},
					[TenantActions.projectViewMember],
				)
			}
		}
		return out
	}
}

/**
 * Mirror legacy mapper for invite/unmanagedInvite at
 * `AclSchemaAccessNodeFactory.ts:24,29`:
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

function appendStatementsForRule(
	out: Statement[],
	resource: string,
	invoker: Acl.Membership,
	rule: Acl.MembershipMatchRule,
	actions: readonly string[],
): void {
	if (rule === false || rule === undefined) {
		// matches nothing — emit no statement
		return
	}
	if (rule === true) {
		// allow any subject role
		out.push({
			effect: 'allow',
			actions: [...actions],
			resources: [resource],
		})
		return
	}
	for (const [subjectRole, perRole] of Object.entries(rule)) {
		if (!perRole) continue
		const conditions: Record<string, Record<string, unknown>> = {
			stringEquals: { 'subject.membership.role': subjectRole },
		}

		// Variable-matching semantics mirror MembershipMatcher precisely:
		//   - `perRole === true`               → subject may have any variables (no constraints)
		//   - `perRole.variables === true`     → same
		//   - otherwise → subject may only carry variables whose names are mapped,
		//                  and each such variable's values must be a subset of the
		//                  invoker's corresponding values (or `true` to pass any).
		// The shape constraint is encoded via `forAllKeys:stringEquals` against
		// the set of allowed variable names — this rejects subjects that carry
		// extra variables not mentioned in the rule (which `MembershipMatcher`
		// rejects via `subject.variables.every` looking up an undefined rule).
		if (perRole !== true) {
			const variables = perRole.variables
			if (variables !== true) {
				const allowedKeys = variables ? Object.keys(variables) : []
				conditions['forAllKeys:stringEquals'] = {
					'subject.membership.variables': allowedKeys,
				}
				if (variables) {
					for (const [subjectVar, mapping] of Object.entries(variables)) {
						if (mapping === true) {
							// any value of this variable passes — no condition added
							continue
						}
						// mapping is the invoker variable name — values from the invoker
						// membership become the allowed set on the subject side. The
						// engine's `forAllValues:stringEquals` is vacuous on absent path,
						// matching `MembershipMatcher` which iterates the SUBJECT's
						// variables and skips ones the subject doesn't carry.
						const invokerVariable = invoker.variables.find(v => v.name === mapping)
						const allowedValues = invokerVariable?.values ?? []
						const forAll = conditions['forAllValues:stringEquals'] ?? {}
						forAll[`subject.membership.variables.${subjectVar}`] = allowedValues
						conditions['forAllValues:stringEquals'] = forAll
					}
				}
			}
		}
		out.push({
			effect: 'allow',
			actions: [...actions],
			resources: [resource],
			conditions: conditions as ConditionBlock,
		})
	}
}
