import { Acl } from '@contember/schema'

export interface RoleOptions {
	stages?: Acl.StagesDefinition
	tenant?: Acl.TenantPermissions
	system?: Acl.SystemPermissions
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
