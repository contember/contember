import { Permissions } from '@contember/authorization'
import { Identity } from '@contember/engine-common'

class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()
		permissions.allow(Identity.ProjectRole.ADMIN, Permissions.ALL, Permissions.ALL)

		return permissions
	}
}

export default PermissionsFactory
