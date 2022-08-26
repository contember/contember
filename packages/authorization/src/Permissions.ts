import { Authorizator } from './Authorizator'

class Permissions {
	private permissions: Permissions.PermissionsMap = {}

	public allow<Meta = undefined>(
		role: string,
		{ resource, privilege }: Authorizator.Action<Meta>,
		verifier: (meta: Meta) => boolean = () => true,
	) {
		this.permissions[role] ??= {}
		this.permissions[role][resource] ??= {}
		this.permissions[role][resource][privilege] = verifier
	}

	public isAllowed(role: string, resource: string, action: string, meta: any): boolean {
		const rolePermissions = this.permissions[role]
		if (!rolePermissions) {
			return false
		}
		for (let tmpResource of [resource, Permissions.ALL]) {
			for (let tmpAction of [action, Permissions.ALL]) {
				if (rolePermissions[tmpResource]?.[tmpAction]?.(meta) === true) {
					return true
				}
			}
		}
		return false
	}
}

namespace Permissions {
	export const ALL = '*'
	export type PermissionsMap = {
		[role: string]: {
			[resource: string]: {
				[privilege: string]: (meta: any) => boolean
			}
		}
	}
}

export { Permissions }
