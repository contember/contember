import Authorizator from '../../../core/authorization/Authorizator'

namespace Actions {
	export enum Resources {
		system = 'system',
		person = 'person',
		project = 'project',
		apiKey = 'apiKey',
	}

	export const SYSTEM_SETUP: Authorizator.Action = [Resources.system, 'setup']

	export const PERSON_SIGN_IN: Authorizator.Action = [Resources.person, 'signIn']
	export const PERSON_SIGN_UP: Authorizator.Action = [Resources.person, 'signUp']
	export const PERSON_SIGN_OUT: Authorizator.Action = [Resources.person, 'signOut']
	export const PERSON_CHANGE_PASSWORD: Authorizator.Action = [Resources.person, 'changePassword']

	export const PROJECT_VIEW_ALL: Authorizator.Action = [Resources.project, 'viewAll']
	export const PROJECT_ADD_MEMBER: Authorizator.Action = [Resources.project, 'addMember']
	export const PROJECT_UPDATE_MEMBER_VARIABLES: Authorizator.Action = [Resources.project, 'updateMemberVariables']

	export const API_KEY_CREATE: Authorizator.Action = [Resources.apiKey, 'create']
	export const API_KEY_DISABLE: Authorizator.Action = [Resources.apiKey, 'disable']
}

export default Actions
