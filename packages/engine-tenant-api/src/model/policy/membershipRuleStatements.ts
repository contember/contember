import { Acl } from '@contember/schema'
import { ConditionBlock, Statement } from '@contember/policy'

/**
 * Translate a single invoker membership and its associated
 * `MembershipMatchRule` into policy engine `Statement`s that allow the given
 * actions on the given resource when the subject's role/variables fall within
 * the rule.
 *
 * Semantics (preserved precisely from the legacy membership-rule matcher):
 *   - `rule === false | undefined` → matches nothing → no statements emitted
 *   - `rule === true` → unconditional allow for any subject role
 *   - `rule` is an object → one statement per `subjectRole` whose entry is
 *     truthy:
 *       - `perRole === true` → no variable constraints; any subject variables pass
 *       - `perRole.variables === true` → same
 *       - otherwise the statement's conditions encode:
 *           * `forAllKeys:stringEquals` on `subject.membership.variables` —
 *             rejects subjects carrying variables not mentioned in the rule
 *           * `forAllValues:stringEquals` per mapped variable — the subject's
 *             values for that variable must be a subset of the invoker's
 *             corresponding variable values; `mapping === true` lifts the
 *             value constraint for that variable.
 */
export function statementsForMembershipRule(
	invoker: Acl.Membership,
	rule: Acl.MembershipMatchRule,
	actions: readonly string[],
	resource: string,
): Statement[] {
	const out: Statement[] = []
	if (rule === false || rule === undefined) {
		return out
	}
	if (rule === true) {
		out.push({
			effect: 'allow',
			actions: [...actions],
			resources: [resource],
		})
		return out
	}
	for (const [subjectRole, perRole] of Object.entries(rule)) {
		if (!perRole) continue
		const conditions: Record<string, Record<string, unknown>> = {
			stringEquals: { 'subject.membership.role': subjectRole },
		}

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
						// engine's `forAllValues:stringEquals` is vacuous on an absent
						// path, so a subject that doesn't carry this variable passes —
						// matching the legacy semantics that iterate the SUBJECT side
						// and skip variables the subject doesn't carry.
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
	return out
}
