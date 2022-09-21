import { Acl, JSONValue } from '@contember/schema'

export type RoleOptions =
	& Omit<Acl.BaseRolePermissions, 'variables' | 'entities' | 'inherits'>
	& {
		readonly [key: string]: JSONValue
	}

export class Role<Name extends string = string> {
	public constructor(
		public readonly name: Name,
		public readonly options: RoleOptions,
	) {
	}
}

export const createRole = <Name extends string>(name: Name, options: RoleOptions = {}): Role<Name> => {
	return new Role(name, options)
}
