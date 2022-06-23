import Authorizator from './Authorizator.js'

class Permissions {
	private permissions: Permissions.PermissionsMap = {}

	public allow(role: string, { resource, privilege }: Authorizator.Action) {
		if (!this.permissions[role]) {
			this.permissions[role] = {}
		}
		if (!this.permissions[role][resource]) {
			this.permissions[role][resource] = {}
		}
		this.permissions[role][resource][privilege] = true
	}

	public isAllowed(role: string, resource: string, action: string): boolean {
		const rolePermissions = this.permissions[role]
		if (!rolePermissions) {
			return false
		}
		for (let tmpResource of [resource, Permissions.ALL]) {
			for (let tmpAction of [action, Permissions.ALL]) {
				if (rolePermissions[tmpResource] && rolePermissions[tmpResource][tmpAction] === true) {
					return true
				}
			}
		}
		return false
	}
}

namespace Permissions {
	export const ALL = '*'
	export type PermissionsMap = { [role: string]: { [resource: string]: { [privilege: string]: true } } }
}

export default Permissions
