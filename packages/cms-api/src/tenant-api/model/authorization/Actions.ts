import Authorizator from '../../../core/authorization/Authorizator'

namespace Actions {
	export enum Resources {
		system = 'system',
		person = 'person',
		project = 'project',
	}

	export const SYSTEM_SETUP: Authorizator.Action = [Resources.system, 'setup']

	export const PERSON_SIGN_IN: Authorizator.Action = [Resources.person, 'signIn']
	export const PERSON_SIGN_UP: Authorizator.Action = [Resources.person, 'signUp']

	export const PROJECT_ADD_MEMBER: Authorizator.Action = [Resources.project, 'addMember']
	export const PROJECT_UPDATE_MEMBER_VARIABLES: Authorizator.Action = [Resources.project, 'updateMemberVariables']
}

export default Actions
