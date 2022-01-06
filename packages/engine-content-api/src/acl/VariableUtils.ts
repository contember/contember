import { Acl } from '@contember/schema'
import { getRoleVariables } from '@contember/schema-utils'

type Memberships = readonly { role: string; variables: readonly { name: string; values: readonly string[] }[] }[]

export const createAclVariables = (
	aclSchema: Acl.Schema,
	identity: {
		identityId: string
		personId: string | null
		memberships: Memberships
	},
): Acl.VariablesMap => {

	const variablesEntries = identity.memberships.flatMap(
		membership => {
			const roleVariables = getRoleVariables(membership.role, aclSchema)
			const membershipVariablesMap = Object.fromEntries(membership.variables.map(it => [it.name, it.values]))

			return Object.entries(roleVariables).map(([name, def]) => {
				const prefixed = prefixVariable(membership.role, name)

				switch (def.type) {
					case Acl.VariableType.entity:
						return [prefixed, membershipVariablesMap[name] ?? []]
					case Acl.VariableType.predefined:
						switch (def.value) {
							case 'identityID':
								return [prefixed, [identity.identityId]]
							case 'personID':
								return [prefixed, identity.personId ? [identity.personId] : []]
						}
				}
			})
		},
	)

	return Object.fromEntries(variablesEntries)
}

export const prefixVariable = (role: string, variableName: string) => `${role}__${variableName}`
