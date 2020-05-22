import { Authorizator } from '@contember/authorization'

export namespace AuthorizationActions {
	export enum Resources {
		project = 'project',
	}

	export const PROJECT_RELEASE_ANY = Authorizator.createAction(Resources.project, 'releaseAny')
	export const PROJECT_RELEASE_SOME = Authorizator.createAction(Resources.project, 'releaseSome')

	export const PROJECT_REBASE_ANY = Authorizator.createAction(Resources.project, 'rebaseAny')

	export const PROJECT_DIFF_ANY = Authorizator.createAction(Resources.project, 'diffAny')
	export const PROJECT_DIFF_SOME = Authorizator.createAction(Resources.project, 'diffSome')

	export const PROJECT_HISTORY_ANY = Authorizator.createAction(Resources.project, 'historyAny')

	export const PROJECT_MIGRATE = Authorizator.createAction(Resources.project, 'migrate')
}
