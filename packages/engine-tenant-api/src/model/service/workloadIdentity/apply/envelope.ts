import { Acl } from '@contember/schema'
import { getRoleVariables } from '@contember/schema-utils'

/** Concrete values a variable may be assumed with, or `'*'` for any value. */
export type EnvelopeVariableRange = readonly string[] | '*'

/** One role the envelope lets the caller assume, expanded against the current project schema (§7b). */
export interface EnvelopeClosureTarget {
	readonly role: string
	readonly variables: Readonly<Record<string, EnvelopeVariableRange>>
	/** Some variable is unbounded; such a grant needs global authority to add members. */
	readonly unbounded: boolean
	/** `system` / `debug` flags of the target role an assumption grants along with it. */
	readonly sensitiveFlags: readonly string[]
}

export interface EnvelopeRuleError {
	/** The target role of the rule, `null` for the rule as a whole. */
	readonly role: string | null
	readonly variable?: string
	readonly message: string
}

export type EnvelopeExpansionResult =
	| { readonly ok: true; readonly targets: readonly EnvelopeClosureTarget[] }
	| { readonly ok: false; readonly errors: readonly EnvelopeRuleError[] }

const hasOwn = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key)

const sensitiveFlagsOf = (role: Acl.RolePermissions): readonly string[] => {
	const flags: string[] = []
	if (role.system?.assumeIdentity === true) {
		flags.push('assumeIdentity')
	}
	if (role.system?.history === true || role.system?.history === 'any') {
		flags.push('history')
	}
	if (role.system?.migrate === true) {
		flags.push('migrate')
	}
	if (role.debug === true) {
		flags.push('debug')
	}
	return flags
}

/**
 * Expands the envelope rule of one source membership into its finite closure (§7b). A rule whose closure
 * cannot be represented exactly — an unknown role, an uncovered or predefined variable, a reference to a
 * variable the source membership does not carry — is rejected, never approximated.
 */
export const expandEnvelope = (
	acl: Acl.Schema,
	membership: Acl.Membership,
	rule: Acl.MembershipMatchRule,
): EnvelopeExpansionResult => {
	if (rule === false) {
		return { ok: true, targets: [] }
	}
	if (rule === true) {
		return {
			ok: false,
			errors: [{ role: null, message: 'a rule must name its target roles; `true` would also admit roles added to the schema later' }],
		}
	}
	const errors: EnvelopeRuleError[] = []
	const targets: EnvelopeClosureTarget[] = []
	for (const [roleName, roleRule] of Object.entries(rule)) {
		if (!hasOwn(acl.roles, roleName)) {
			errors.push({ role: roleName, message: 'role is not defined in the project schema' })
			continue
		}
		const roleVariables = getRoleVariables(roleName, acl)
		const coveredVariables = Object.entries(roleVariables)
			.filter(([, variable]) => variable.type !== Acl.VariableType.predefined)
			.map(([name]) => name)
		const sensitiveFlags = sensitiveFlagsOf(acl.roles[roleName])

		const variablesRule = roleRule === true ? true : roleRule.variables ?? {}
		if (variablesRule === true) {
			targets.push({
				role: roleName,
				variables: Object.fromEntries(coveredVariables.map(name => [name, '*'])),
				unbounded: true,
				sensitiveFlags,
			})
			continue
		}

		const roleErrors: EnvelopeRuleError[] = []
		const variables: Record<string, EnvelopeVariableRange> = {}
		for (const [variableName, variableRule] of Object.entries(variablesRule)) {
			if (!hasOwn(roleVariables, variableName)) {
				roleErrors.push({ role: roleName, variable: variableName, message: 'variable is not defined on the role' })
				continue
			}
			if (roleVariables[variableName].type === Acl.VariableType.predefined) {
				roleErrors.push({
					role: roleName,
					variable: variableName,
					message: 'a predefined variable is always derived from the trust identity and cannot be assumed',
				})
				continue
			}
			if (variableRule === true) {
				variables[variableName] = '*'
				continue
			}
			const source = membership.variables.find(it => it.name === variableRule)
			if (!source || source.values.length === 0) {
				roleErrors.push({
					role: roleName,
					variable: variableName,
					message: `references variable ${variableRule}, which the source membership ${membership.role} does not carry`,
				})
				continue
			}
			variables[variableName] = [...new Set(source.values)].sort()
		}
		for (const name of coveredVariables) {
			if (!hasOwn(variablesRule, name)) {
				roleErrors.push({ role: roleName, variable: name, message: 'the rule must name every variable of the role' })
			}
		}
		if (roleErrors.length > 0) {
			errors.push(...roleErrors)
			continue
		}
		targets.push({
			role: roleName,
			variables,
			unbounded: Object.values(variables).some(it => it === '*'),
			sensitiveFlags,
		})
	}
	return errors.length > 0 ? { ok: false, errors } : { ok: true, targets }
}

/** The direct grant a bounded closure target stands for. */
export const closureTargetToMembership = (target: EnvelopeClosureTarget): Acl.Membership => ({
	role: target.role,
	variables: Object.entries(target.variables).flatMap(([name, range]) => range === '*' ? [] : [{ name, values: range }]),
})
