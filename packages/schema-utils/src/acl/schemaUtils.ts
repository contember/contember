import { Acl } from '@contember/schema'

export const getRoleVariables = (roleName: string, schema: Acl.Schema): Acl.Variables => {
	const role = schema.roles[roleName]
	return (role.inherits || []).reduce<Acl.Variables>(
		(acc, inheritsFrom) => ({ ...getRoleVariables(inheritsFrom, schema), ...acc }),
		role.variables,
	)
}
