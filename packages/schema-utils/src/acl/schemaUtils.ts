import { Acl } from '@contember/schema'

export const getRoleVariables = (roleName: string, schema: Acl.Schema): Acl.Variables => {
	// Own-property lookup: a role name like `__proto__` / `constructor`, or an `inherits` entry pointing
	// at a role absent from the schema, must resolve to "no such role" (→ no variables) instead of an
	// inherited Object.prototype member — otherwise `role.inherits` / `role.variables` below throw on a
	// non-role value (e.g. a sign-in granting such a role would roll back the whole transaction).
	const role = Object.prototype.hasOwnProperty.call(schema.roles, roleName) ? schema.roles[roleName] : undefined
	if (!role) {
		return {}
	}
	return (role.inherits || []).reduce<Acl.Variables>(
		(acc, inheritsFrom) => ({ ...getRoleVariables(inheritsFrom, schema), ...acc }),
		role.variables,
	)
}
