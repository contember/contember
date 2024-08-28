import { Authorizator } from '@contember/authorization'
import { Acl } from '@contember/schema'

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
	}


	export const CONFIGURE = Authorizator.createAction(Resources.system, 'configure')
	export const CONFIG_VIEW = Authorizator.createAction(Resources.system, 'viewConfig')

	export const IDENTITY_VIEW_PERMISSIONS = Authorizator.createAction(Resources.identity, 'viewPermissions')
	export const IDENTITY_ADD_GLOBAL_ROLES = (roles?: readonly string[]) => Authorizator.createAction(Resources.identity, 'addGlobalRoles', { roles })
	export const IDENTITY_REMOVE_GLOBAL_ROLES = (roles?: readonly string[]) => Authorizator.createAction(Resources.identity, 'removeGlobalRoles', { roles })

	export const PERSON_DISABLE = (roles?: readonly string[]) => Authorizator.createAction(Resources.person, 'disable', { roles })

	export const PERSON_VIEW = Authorizator.createAction(Resources.person, 'view')
	export const PERSON_SIGN_IN = Authorizator.createAction(Resources.person, 'signIn')
	export const PERSON_SIGN_UP = (roles?: readonly string[]) => Authorizator.createAction(Resources.person, 'signUp', { roles })
	export const PERSON_SIGN_OUT = Authorizator.createAction(Resources.person, 'signOut')
	export const PERSON_SETUP_OTP = Authorizator.createAction(Resources.person, 'setupOtp')
	export const PERSON_CHANGE_PROFILE = (roles?: readonly string[]) => Authorizator.createAction(Resources.person, 'changeProfile', { roles })
	export const PERSON_CHANGE_MY_PROFILE = Authorizator.createAction(Resources.person, 'changeMyProfile')
	export const PERSON_CHANGE_PASSWORD = (roles?: readonly string[]) => Authorizator.createAction(Resources.person, 'changePassword', { roles })
	export const PERSON_CHANGE_MY_PASSWORD = Authorizator.createAction(Resources.person, 'changeMyPassword')
	export const PERSON_RESET_PASSWORD = Authorizator.createAction(Resources.person, 'resetPassword')
	export const PERSON_CREATE_IDP_URL = Authorizator.createAction(Resources.person, 'createIdPUrl')
	export const PERSON_SIGN_IN_IDP = Authorizator.createAction(Resources.person, 'signInIdp')
	export const PERSON_REQUEST_PASSWORDLESS_SIGN_IN = Authorizator.createAction(Resources.person, 'requestPasswordlessSignIn')
	export const PERSON_PASSWORDLESS_SIGN_IN = Authorizator.createAction(Resources.person, 'passwordlessSignIn')
	export const PERSON_CREATE_SESSION_KEY = (roles?: readonly string[]) => Authorizator.createAction(Resources.person, 'createSessionToken', { roles })

	export const PERSON_INVITE = (memberships: readonly Acl.Membership[]) => Authorizator.createAction(Resources.person, 'invite', { memberships })
	export const PERSON_INVITE_UNMANAGED = (memberships: readonly Acl.Membership[]) => Authorizator.createAction(Resources.person, 'invite_unmanaged', { memberships })

	export const PROJECT_VIEW = Authorizator.createAction(Resources.project, 'view')
	export const PROJECT_SET_SECRET = Authorizator.createAction(Resources.project, 'setSecret')
	export const PROJECT_UPDATE = Authorizator.createAction(Resources.project, 'update')

	export const PROJECT_CREATE = Authorizator.createAction(Resources.project, 'create')
	export const ENTRYPOINT_DEPLOY = Authorizator.createAction(Resources.entrypoint, 'deployEntrypoint')

	export const PROJECT_VIEW_MEMBER = (memberships: readonly Acl.Membership[]) => Authorizator.createAction(Resources.project, 'viewMembers', { memberships })
	export const PROJECT_ADD_MEMBER = (memberships: readonly Acl.Membership[]) => Authorizator.createAction(Resources.project, 'addMember', { memberships })
	export const PROJECT_REMOVE_MEMBER = (memberships: readonly Acl.Membership[]) => Authorizator.createAction(Resources.project, 'removeMember', { memberships })
	export const PROJECT_UPDATE_MEMBER = (memberships: readonly Acl.Membership[]) => Authorizator.createAction(Resources.project, 'updateMember', { memberships })


	export const API_KEY_CREATE = Authorizator.createAction(Resources.apiKey, 'create')
	export const API_KEY_CREATE_GLOBAL = (roles?: readonly string[]) => Authorizator.createAction(Resources.apiKey, 'createGlobal', { roles })
	export const API_KEY_DISABLE = Authorizator.createAction(Resources.apiKey, 'disable')

	export const MAIL_TEMPLATE_ADD = Authorizator.createAction(Resources.mailTemplate, 'add')
	export const MAIL_TEMPLATE_REMOVE = Authorizator.createAction(Resources.mailTemplate, 'remove')
	export const MAIL_TEMPLATE_LIST = Authorizator.createAction(Resources.mailTemplate, 'list')

	export const IDP_ADD = Authorizator.createAction(Resources.idp, 'add')
	export const IDP_UPDATE = Authorizator.createAction(Resources.idp, 'update')
	export const IDP_DISABLE = Authorizator.createAction(Resources.idp, 'disable')
	export const IDP_ENABLE = Authorizator.createAction(Resources.idp, 'enable')
	export const IDP_LIST = Authorizator.createAction(Resources.idp, 'list')
}

export { PermissionActions }
