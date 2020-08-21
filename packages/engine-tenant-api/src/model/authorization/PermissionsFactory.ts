import { Permissions } from '@contember/authorization'
import { PermissionActions } from './PermissionActions'
import { TenantRole } from './Roles'

class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()
		permissions.allow(TenantRole.SUPER_ADMIN, { resource: Permissions.ALL, privilege: Permissions.ALL })
		permissions.allow(TenantRole.LOGIN, PermissionActions.PERSON_SIGN_IN)
		permissions.allow(TenantRole.SETUP, PermissionActions.SYSTEM_SETUP)
		permissions.allow(TenantRole.SELF, PermissionActions.PERSON_CHANGE_PASSWORD)
		permissions.allow(TenantRole.PERSON, PermissionActions.PERSON_SIGN_OUT)
		permissions.allow(TenantRole.PERSON, PermissionActions.PERSON_SETUP_OTP)
		permissions.allow(TenantRole.PROJECT_MEMBER, PermissionActions.PROJECT_VIEW)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.API_KEY_CREATE)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.API_KEY_CREATE)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.API_KEY_DISABLE)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PROJECT_VIEW_MEMBER([]))
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PROJECT_ADD_MEMBER([]))
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PROJECT_UPDATE_MEMBER([]))
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PROJECT_REMOVE_MEMBER([]))
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PERSON_INVITE([]))
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PERSON_INVITE_UNMANAGED([]))
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.MAIL_TEMPLATE_ADD)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.MAIL_TEMPLATE_REMOVE)

		return permissions
	}
}

export { PermissionsFactory }
