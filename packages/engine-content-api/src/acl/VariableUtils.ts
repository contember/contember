import { Acl } from '@contember/schema'

type Memberships = readonly { role: string; variables: readonly { name: string, values: readonly string[] }[] }[]

export const flattenVariables = (memberships: Memberships): Acl.VariablesMap => {
	return memberships.reduce(
		(acc, membership) => ({
			...acc,
			...membership.variables.reduce(
				(acc, {name, values}) => ({ ...acc, [prefixVariable(membership.role, name)]: values }),
				{},
			),
		}),
		{},
	)
}
export const prefixVariable = (role: string, variableName: string) => `${role}__${variableName}`
