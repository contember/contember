import { Permissions } from '@contember/authorization'
import { Identity } from '@contember/engine-common'
import { PermissionActions } from './PermissionActions'

class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()
		permissions.allow(Identity.SystemRole.SUPER_ADMIN, Permissions.ALL, Permissions.ALL)
		permissions.allow(Identity.SystemRole.LOGIN, ...PermissionActions.PERSON_SIGN_IN)
		permissions.allow(Identity.SystemRole.SETUP, ...PermissionActions.SYSTEM_SETUP)
		permissions.allow(Identity.SystemRole.SELF, ...PermissionActions.PERSON_CHANGE_PASSWORD)
		permissions.allow(Identity.SystemRole.PERSON, ...PermissionActions.PERSON_SIGN_OUT)

		return permissions
	}
}

export { PermissionsFactory }
