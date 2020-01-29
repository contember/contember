import { Authorizator } from '@contember/authorization'

namespace PermissionActions {
	export enum Resources {
		system = 'system',
		person = 'person',
		project = 'project',
		apiKey = 'apiKey',
	}

	export const SYSTEM_SETUP = Authorizator.createAction(Resources.system, 'setup')

	export const PERSON_SIGN_IN = Authorizator.createAction(Resources.person, 'signIn')
	export const PERSON_SIGN_UP = Authorizator.createAction(Resources.person, 'signUp')
	export const PERSON_SIGN_OUT = Authorizator.createAction(Resources.person, 'signOut')
	export const PERSON_CHANGE_PASSWORD = Authorizator.createAction(Resources.person, 'changePassword')
	export const PERSON_INVITE = Authorizator.createAction(Resources.person, 'invite')

	export const PROJECT_VIEW = Authorizator.createAction(Resources.project, 'view')

	export const PROJECT_VIEW_MEMBERS = Authorizator.createAction(Resources.project, 'viewMembers')
	export const PROJECT_ADD_MEMBER = Authorizator.createAction(Resources.project, 'addMember')
	export const PROJECT_REMOVE_MEMBER = Authorizator.createAction(Resources.project, 'removeMember')
	export const PROJECT_UPDATE_MEMBER = Authorizator.createAction(Resources.project, 'updateMember')

	export const API_KEY_CREATE = Authorizator.createAction(Resources.apiKey, 'create')
	export const API_KEY_DISABLE = Authorizator.createAction(Resources.apiKey, 'disable')
}

export { PermissionActions }
