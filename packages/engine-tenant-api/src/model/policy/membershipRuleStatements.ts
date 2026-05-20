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
				// Keys the subject is allowed to carry, and the per-key value constraints.
				// A mapped variable whose invoker counterpart is absent is intentionally
				// excluded from `allowedKeys`: the legacy matcher iterates the subject side
				// and bails (`return false`) on a missing invoker variable, so it denies any
				// subject that carries such a variable at all — even with an empty value list.
				// Excluding the key makes `forAllKeys:stringEquals` reject exactly those
				// subjects, while a subject that doesn't carry the key still passes.
				const allowedKeys: string[] = []
				const forAllValues: Record<string, readonly string[]> = {}
				if (variables) {
					for (const [subjectVar, mapping] of Object.entries(variables)) {
						if (mapping === true) {
							// any value of this variable passes — only the key is allowed
							allowedKeys.push(subjectVar)
							continue
						}
						const invokerVariable = invoker.variables.find(v => v.name === mapping)
						if (!invokerVariable) {
							// invoker lacks the mapped variable → subject must not carry this key
							continue
						}
						// the subject's values must be a subset of the invoker's values
						allowedKeys.push(subjectVar)
						forAllValues[`subject.membership.variables.${subjectVar}`] = invokerVariable.values
					}
				}
				conditions['forAllKeys:stringEquals'] = {
					'subject.membership.variables': allowedKeys,
				}
				if (Object.keys(forAllValues).length > 0) {
					conditions['forAllValues:stringEquals'] = forAllValues
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
