import { Acl } from '@contember/schema'
import { getRoleVariables } from '@contember/schema-utils'


export const createAclVariables = (
	aclSchema: Acl.Schema,
	identity: {
		identityId: string
		personId: string | null
		memberships: readonly Acl.Membership[]
	},
): Acl.VariablesMap => {

	const variablesEntries = identity.memberships.flatMap(
		membership => {
			const roleVariables = getRoleVariables(membership.role, aclSchema)
			const membershipVariablesMap = Object.fromEntries(membership.variables.map(it => [it.name, it.values]))

			return Object.entries(roleVariables).map(([name, def]): [string, Acl.VariableMapEntry] => {
				const prefixed = prefixVariable(membership.role, name)
				const value = (() => {
					switch (def.type) {
						case Acl.VariableType.entity:
							return membershipVariablesMap[name] ?? []
						case Acl.VariableType.predefined:
							switch (def.value) {
								case 'identityID':
									return [identity.identityId]
								case 'personID':
									return identity.personId ? [identity.personId] : []
							}
							throw new Error(`Unknown predefined variable ${def.value}`)
						case Acl.VariableType.condition:
							return (membershipVariablesMap[name] ?? []).map(it => JSON.parse(it))
					}
				})()
				return [prefixed, { value: value, definition: def }]
			})
		},
	)

	return Object.fromEntries(variablesEntries)
}

export const prefixVariable = (role: string, variableName: string) => `${role}__${variableName}`
