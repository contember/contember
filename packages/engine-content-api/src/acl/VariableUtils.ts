import { Acl, Input } from '@contember/schema'
import { getRoleVariables, ParsedMembership } from '@contember/schema-utils'


export const createAclVariables = (
	aclSchema: Acl.Schema,
	memberships: readonly ParsedMembership[],
): Acl.VariablesMap => {

	const variablesEntries = memberships.flatMap(
		membership => {
			const roleVariables = getRoleVariables(membership.role, aclSchema)
			const membershipVariablesMap = Object.fromEntries(membership.variables.map(it => [it.name, it.condition]))

			return Object.keys(roleVariables).map((name): [string, Input.Condition] => {
				const prefixed = prefixVariable(membership.role, name)
				return [prefixed, membershipVariablesMap[name] ?? { never: true }]
			})
		},
	)

	return Object.fromEntries(variablesEntries)
}

export const prefixVariable = (role: string, variableName: string) => `${role}__${variableName}`
