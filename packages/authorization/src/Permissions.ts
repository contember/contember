import { Authorizator } from './Authorizator.js'

type PermissionVerifier = Permissions.PermissionsMap[string][string][string]
type InternalPermissionsMap = Map<string, Map<string, Map<string, PermissionVerifier>>>

class Permissions {
	private permissions: InternalPermissionsMap = new Map()

	public allow<Meta extends {} | undefined = undefined>(
		role: string,
		{ resource, privilege }: Authorizator.Action<Meta>,
		verifier: (meta: Meta) => boolean = () => true,
	) {
		let rolePermissions = this.permissions.get(role)
		if (rolePermissions === undefined) {
			rolePermissions = new Map()
			this.permissions.set(role, rolePermissions)
		}
		let resourcePermissions = rolePermissions.get(resource)
		if (resourcePermissions === undefined) {
			resourcePermissions = new Map()
			rolePermissions.set(resource, resourcePermissions)
		}
		resourcePermissions.set(privilege, verifier)
	}

	public isAllowed(role: string, resource: string, action: string, meta: any): boolean {
		const rolePermissions = this.permissions.get(role)
		if (!rolePermissions) {
			return false
		}
		for (let tmpResource of [resource, Permissions.ALL]) {
			for (let tmpAction of [action, Permissions.ALL]) {
				if (rolePermissions.get(tmpResource)?.get(tmpAction)?.(meta) === true) {
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
