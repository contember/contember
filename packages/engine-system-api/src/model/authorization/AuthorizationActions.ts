import { Authorizator } from '@contember/authorization'

export namespace AuthorizationActions {
	export enum Resources {
		project = 'project',
	}

	export const PROJECT_RELEASE_ANY = Authorizator.createAction(Resources.project, 'releaseAny')
	export const PROJECT_REBASE_ALL = Authorizator.createAction(Resources.project, 'rebaseAll')
	export const PROJECT_MIGRATE = Authorizator.createAction(Resources.project, 'migrate')
}
