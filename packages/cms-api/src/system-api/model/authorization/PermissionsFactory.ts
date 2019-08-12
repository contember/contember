import { Permissions } from '@contember/authorization'
import { Identity } from '@contember/engine-common'

class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()
		permissions.allow(Identity.SystemRole.SUPER_ADMIN, Permissions.ALL, Permissions.ALL)

		return permissions
	}
}

export default PermissionsFactory
