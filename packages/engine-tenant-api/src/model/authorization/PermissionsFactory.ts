import { Permissions } from '@contember/authorization'
import { PermissionActions } from './PermissionActions.js'
import { TenantRole } from './Roles.js'

class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()

		permissions.allow(TenantRole.SUPER_ADMIN, { resource: Permissions.ALL, privilege: Permissions.ALL })

		permissions.allow(TenantRole.LOGIN, PermissionActions.PERSON_SIGN_IN)
		permissions.allow(TenantRole.LOGIN, PermissionActions.PERSON_RESET_PASSWORD)
		permissions.allow(TenantRole.LOGIN, PermissionActions.PERSON_CREATE_IDP_URL)
		permissions.allow(TenantRole.LOGIN, PermissionActions.PERSON_SIGN_IN_IDP)

		permissions.allow(TenantRole.PERSON, PermissionActions.PERSON_CHANGE_MY_PASSWORD)
		permissions.allow(TenantRole.PERSON, PermissionActions.PERSON_SIGN_OUT)
		permissions.allow(TenantRole.PERSON, PermissionActions.PERSON_SETUP_OTP)

		permissions.allow(TenantRole.PROJECT_MEMBER, PermissionActions.PROJECT_VIEW)

		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PROJECT_VIEW)
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

		permissions.allow(TenantRole.PROJECT_CREATOR, PermissionActions.PROJECT_CREATE)

		return permissions
	}
}

export { PermissionsFactory }
