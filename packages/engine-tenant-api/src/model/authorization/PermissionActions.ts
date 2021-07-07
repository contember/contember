import { Authorizator } from '@contember/authorization'
import { Membership } from '../type/Membership'

namespace PermissionActions {
	export enum Resources {
		system = 'system',
		person = 'person',
		project = 'project',
		apiKey = 'apiKey',
		mailTemplate = 'mailTemplate',
	}

	export const PERSON_SIGN_IN = Authorizator.createAction(Resources.person, 'signIn')
	export const PERSON_SIGN_UP = Authorizator.createAction(Resources.person, 'signUp')
	export const PERSON_SIGN_OUT = Authorizator.createAction(Resources.person, 'signOut')
	export const PERSON_SETUP_OTP = Authorizator.createAction(Resources.person, 'setupOtp')
	export const PERSON_CHANGE_PASSWORD = Authorizator.createAction(Resources.person, 'changePassword')
	export const PERSON_RESET_PASSWORD = Authorizator.createAction(Resources.person, 'resetPassword')
	export const PERSON_CREATE_IDP_URL = Authorizator.createAction(Resources.person, 'createIdPUrl')
	export const PERSON_SIGN_IN_IDP = Authorizator.createAction(Resources.person, 'signInIdp')

	export const PERSON_INVITE = (memberships: readonly Membership[]) =>
		Authorizator.createAction(Resources.person, 'invite', { memberships })

	export const PERSON_INVITE_UNMANAGED = (memberships: readonly Membership[]) =>
		Authorizator.createAction(Resources.person, 'invite_unmanaged', { memberships })

	export const PROJECT_VIEW = Authorizator.createAction(Resources.project, 'view')

	export const PROJECT_VIEW_MEMBER = (memberships: readonly Membership[]) =>
		Authorizator.createAction(Resources.project, 'viewMembers', { memberships })
	export const PROJECT_ADD_MEMBER = (memberships: readonly Membership[]) =>
		Authorizator.createAction(Resources.project, 'addMember', { memberships })
	export const PROJECT_REMOVE_MEMBER = (memberships: readonly Membership[]) =>
		Authorizator.createAction(Resources.project, 'removeMember', { memberships })
	export const PROJECT_UPDATE_MEMBER = (memberships: readonly Membership[]) =>
		Authorizator.createAction(Resources.project, 'updateMember', { memberships })

	export const API_KEY_CREATE = Authorizator.createAction(Resources.apiKey, 'create')
	export const API_KEY_DISABLE = Authorizator.createAction(Resources.apiKey, 'disable')

	export const MAIL_TEMPLATE_ADD = Authorizator.createAction(Resources.mailTemplate, 'add')
	export const MAIL_TEMPLATE_REMOVE = Authorizator.createAction(Resources.mailTemplate, 'remove')
}

export { PermissionActions }
