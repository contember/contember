import { Permissions } from '@contember/authorization'
import { PermissionActions } from './PermissionActions'
import { TenantRole } from './Roles'

const allowedRoles = new Set<string>([TenantRole.LOGIN, TenantRole.PROJECT_ADMIN, TenantRole.ENTRYPOINT_DEPLOYER])

const projectAdminAllowedInputRoles = ({ roles }: {roles?: readonly string[]}) => {
	return roles === undefined || roles.every(it => allowedRoles.has(it))
}

const forbiddenRoles = new Set<string>([TenantRole.SUPER_ADMIN, TenantRole.PROJECT_CREATOR])

const projectAdminUseRolesVerifier = ({ roles }: { roles?: readonly string[] }) => {
	return roles === undefined || roles.every(it => !forbiddenRoles.has(it))
}

class PermissionsFactory {
	public create(): Permissions {
		const permissions = new Permissions()

		permissions.allow(TenantRole.SUPER_ADMIN, { resource: Permissions.ALL, privilege: Permissions.ALL })

		permissions.allow(TenantRole.LOGIN, PermissionActions.PERSON_SIGN_IN)
		permissions.allow(TenantRole.LOGIN, PermissionActions.PERSON_RESET_PASSWORD)
		permissions.allow(TenantRole.LOGIN, PermissionActions.PERSON_CREATE_IDP_URL)
		permissions.allow(TenantRole.LOGIN, PermissionActions.PERSON_SIGN_IN_IDP)

		permissions.allow(TenantRole.PERSON, PermissionActions.PERSON_CHANGE_MY_PASSWORD)
		permissions.allow(TenantRole.PERSON, PermissionActions.PERSON_CHANGE_MY_PROFILE)
		permissions.allow(TenantRole.PERSON, PermissionActions.PERSON_SIGN_OUT)
		permissions.allow(TenantRole.PERSON, PermissionActions.PERSON_SETUP_OTP)

		permissions.allow(TenantRole.PROJECT_MEMBER, PermissionActions.PROJECT_VIEW)

		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PROJECT_VIEW)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.API_KEY_CREATE)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.API_KEY_DISABLE)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.API_KEY_CREATE_GLOBAL(), projectAdminAllowedInputRoles)

		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PERSON_SIGN_UP(), projectAdminAllowedInputRoles)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.IDENTITY_ADD_GLOBAL_ROLES(), projectAdminAllowedInputRoles)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.IDENTITY_REMOVE_GLOBAL_ROLES(), projectAdminAllowedInputRoles)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PERSON_CREATE_SESSION_KEY(), projectAdminUseRolesVerifier)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PERSON_DISABLE(), projectAdminUseRolesVerifier)

		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PROJECT_VIEW_MEMBER([]))
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PROJECT_ADD_MEMBER([]))
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PROJECT_UPDATE_MEMBER([]))
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PROJECT_REMOVE_MEMBER([]))

		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PERSON_INVITE([]))
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.PERSON_INVITE_UNMANAGED([]))

		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.MAIL_TEMPLATE_ADD)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.MAIL_TEMPLATE_REMOVE)

		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.IDP_ADD)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.IDP_UPDATE)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.IDP_DISABLE)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.IDP_ENABLE)
		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.IDP_LIST)

		permissions.allow(TenantRole.PROJECT_ADMIN, PermissionActions.ENTRYPOINT_DEPLOY)

		permissions.allow(TenantRole.PROJECT_CREATOR, PermissionActions.PROJECT_CREATE)
		permissions.allow(TenantRole.ENTRYPOINT_DEPLOYER, PermissionActions.ENTRYPOINT_DEPLOY)

		return permissions
	}
}

export { PermissionsFactory }
