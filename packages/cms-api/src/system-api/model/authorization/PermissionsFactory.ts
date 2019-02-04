import Permissions from '../../../core/authorization/Permissions'
import Identity from '../../../common/auth/Identity'

class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()
		permissions.allow(Identity.SystemRole.SUPER_ADMIN, Permissions.ALL, Permissions.ALL)

		return permissions
	}
}

export default PermissionsFactory
