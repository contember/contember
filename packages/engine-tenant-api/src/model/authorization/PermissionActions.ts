import { Authorizator } from '@contember/authorization'
import { Acl } from '@contember/schema'

export type TargetIdentityPermissionTarget = {
	readonly id: string
	readonly globalRoles: readonly string[]
	readonly hasProjectMemberships: boolean
}

export type TargetIdentityPermissionMeta = {
	readonly target: TargetIdentityPermissionTarget | null
}

export type ProfileField = 'name' | 'email'

export type ChangeProfilePermissionMeta = TargetIdentityPermissionMeta & {
	readonly fields: readonly ProfileField[]
}

export type CreateSessionTokenPermissionMeta = {
	readonly phase: 'preflight' | 'target'
	readonly target?: TargetIdentityPermissionTarget
	readonly requestedExpirationMinutes?: number | null
	readonly trustForwardedClientInfo?: boolean
}

export type GlobalRoleMutationPermissionMeta = {
	readonly requestedRoles: readonly string[]
	readonly target: TargetIdentityPermissionTarget
	readonly self: boolean
}

export type GlobalApiKeyPermissionMeta = {
	readonly requestedRoles: readonly string[]
	readonly trustForwardedClientInfo: boolean
}

export type MailTemplatePermissionMeta = {
	readonly kind: 'any' | 'global' | 'project'
	readonly projectSlug?: string | null
	readonly type?: string
}

namespace PermissionActions {
	export enum Resources {
		system = 'system',
		entrypoint = 'entrypoint',
		person = 'person',
		identity = 'identity',
		project = 'project',
		apiKey = 'apiKey',
		mailTemplate = 'mailTemplate',
		idp = 'idp',
		customRole = 'customRole',
	}

	export const CONFIGURE = Authorizator.createAction(Resources.system, 'configure')
	export const CONFIG_VIEW = Authorizator.createAction(Resources.system, 'viewConfig')
	export const AUTH_LOG_VIEW = Authorizator.createAction(Resources.system, 'viewAuthLog')

	export const IDENTITY_VIEW_PERMISSIONS = Authorizator.createAction(Resources.identity, 'viewPermissions')
	export const IDENTITY_ADD_GLOBAL_ROLES = (meta?: GlobalRoleMutationPermissionMeta) =>
		Authorizator.createAction(Resources.identity, 'addGlobalRoles', meta)
	export const IDENTITY_REMOVE_GLOBAL_ROLES = (meta?: GlobalRoleMutationPermissionMeta) =>
		Authorizator.createAction(Resources.identity, 'removeGlobalRoles', meta)

	export const PERSON_DISABLE = (target: TargetIdentityPermissionTarget | null) => Authorizator.createAction(Resources.person, 'disable', { target })
	export const PERSON_FORCE_SIGN_OUT = (target: TargetIdentityPermissionTarget | null) =>
		Authorizator.createAction(Resources.person, 'forceSignOut', { target })
	export const PERSON_RESET_MFA = (target: TargetIdentityPermissionTarget | null) =>
		Authorizator.createAction(Resources.person, 'resetMfa', { target })
	export const PERSON_REVOKE_SESSION = Authorizator.createAction(Resources.person, 'revokeSession')
	export const PERSON_VIEW_SESSIONS = (target: TargetIdentityPermissionTarget | null) =>
		Authorizator.createAction(Resources.person, 'viewSessions', { target })

	export const PERSON_VIEW = Authorizator.createAction(Resources.person, 'view')
	export const PERSON_LIST = Authorizator.createAction(Resources.person, 'list')
	export const PERSON_SIGN_IN = Authorizator.createAction(Resources.person, 'signIn')
	export const PERSON_SIGN_UP = (requestedRoles?: readonly string[]) => Authorizator.createAction(Resources.person, 'signUp', { requestedRoles })
	export const PERSON_SIGN_OUT = Authorizator.createAction(Resources.person, 'signOut')
	export const PERSON_SETUP_OTP = Authorizator.createAction(Resources.person, 'setupOtp')
	export const PERSON_CHANGE_PROFILE = (target: TargetIdentityPermissionTarget | null, fields: readonly ProfileField[]) =>
		Authorizator.createAction(Resources.person, 'changeProfile', { target, fields })
	export const PERSON_CHANGE_MY_PROFILE = Authorizator.createAction(Resources.person, 'changeMyProfile')
	export const PERSON_TOGGLE_PASSWORDLESS = Authorizator.createAction(Resources.person, 'togglePasswordless')
	export const PERSON_CHANGE_PASSWORD = (target: TargetIdentityPermissionTarget | null) =>
		Authorizator.createAction(Resources.person, 'changePassword', { target })
	export const PERSON_CHANGE_MY_PASSWORD = Authorizator.createAction(Resources.person, 'changeMyPassword')
	export const PERSON_RESET_PASSWORD = Authorizator.createAction(Resources.person, 'resetPassword')
	export const PERSON_CREATE_IDP_URL = Authorizator.createAction(Resources.person, 'createIdPUrl')
	export const PERSON_SIGN_IN_IDP = Authorizator.createAction(Resources.person, 'signInIdp')
	export const PERSON_VIEW_IDP = (target: TargetIdentityPermissionTarget | null) => Authorizator.createAction(Resources.person, 'viewIdp', { target })
	export const PERSON_DISCONNECT_MY_IDP = Authorizator.createAction(Resources.person, 'disconnectMyIdp')
	export const PERSON_REQUEST_PASSWORDLESS_SIGN_IN = Authorizator.createAction(Resources.person, 'requestPasswordlessSignIn')
	export const PERSON_PASSWORDLESS_SIGN_IN = Authorizator.createAction(Resources.person, 'passwordlessSignIn')
	export const PERSON_CREATE_SESSION_KEY = (meta: CreateSessionTokenPermissionMeta) =>
		Authorizator.createAction(Resources.person, 'createSessionToken', meta)

	export const PERSON_INVITE = (memberships: readonly Acl.Membership[]) => Authorizator.createAction(Resources.person, 'invite', { memberships })
	export const PERSON_INVITE_UNMANAGED = (memberships: readonly Acl.Membership[]) =>
		Authorizator.createAction(Resources.person, 'invite_unmanaged', { memberships })

	export const PROJECT_VIEW = Authorizator.createAction(Resources.project, 'view')
	export const PROJECT_SET_SECRET = Authorizator.createAction(Resources.project, 'setSecret')
	export const PROJECT_VIEW_SECRETS = Authorizator.createAction(Resources.project, 'viewSecrets')
	export const PROJECT_UPDATE = Authorizator.createAction(Resources.project, 'update')

	export const PROJECT_CREATE = Authorizator.createAction(Resources.project, 'create')
	export const ENTRYPOINT_DEPLOY = Authorizator.createAction(Resources.entrypoint, 'deployEntrypoint')

	export const PROJECT_VIEW_MEMBER = (memberships: readonly Acl.Membership[]) =>
		Authorizator.createAction(Resources.project, 'viewMembers', { memberships })
	export const PROJECT_ADD_MEMBER = (memberships: readonly Acl.Membership[]) =>
		Authorizator.createAction(Resources.project, 'addMember', { memberships })
	export const PROJECT_REMOVE_MEMBER = (memberships: readonly Acl.Membership[]) =>
		Authorizator.createAction(Resources.project, 'removeMember', { memberships })
	export const PROJECT_UPDATE_MEMBER = (memberships: readonly Acl.Membership[]) =>
		Authorizator.createAction(Resources.project, 'updateMember', { memberships })

	export const API_KEY_CREATE = Authorizator.createAction(Resources.apiKey, 'create')
	export const API_KEY_CREATE_GLOBAL = (meta?: GlobalApiKeyPermissionMeta) => Authorizator.createAction(Resources.apiKey, 'createGlobal', meta)
	export const API_KEY_DISABLE = Authorizator.createAction(Resources.apiKey, 'disable')
	export const API_KEY_LIST = Authorizator.createAction(Resources.apiKey, 'list')

	export const MAIL_TEMPLATE_ADD = (meta: MailTemplatePermissionMeta) => Authorizator.createAction(Resources.mailTemplate, 'add', meta)
	export const MAIL_TEMPLATE_REMOVE = (meta: MailTemplatePermissionMeta) => Authorizator.createAction(Resources.mailTemplate, 'remove', meta)
	export const MAIL_TEMPLATE_LIST = (meta: MailTemplatePermissionMeta) => Authorizator.createAction(Resources.mailTemplate, 'list', meta)

	export const IDP_ADD = Authorizator.createAction(Resources.idp, 'add')
	export const IDP_UPDATE = Authorizator.createAction(Resources.idp, 'update')
	export const IDP_DISABLE = Authorizator.createAction(Resources.idp, 'disable')
	export const IDP_ENABLE = Authorizator.createAction(Resources.idp, 'enable')
	export const IDP_LIST = Authorizator.createAction(Resources.idp, 'list')

	export const CUSTOM_ROLE_MANAGE = Authorizator.createAction(Resources.customRole, 'manage')
	export const CUSTOM_ROLE_VIEW = Authorizator.createAction(Resources.customRole, 'view')
}

export { PermissionActions }
