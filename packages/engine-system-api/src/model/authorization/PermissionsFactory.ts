import { Permissions } from '@contember/authorization'
import { ProjectRole } from '@contember/engine-common'

class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()
		permissions.allow(ProjectRole.ADMIN, { resource: Permissions.ALL, privilege: Permissions.ALL })

		return permissions
	}
}

export default PermissionsFactory
