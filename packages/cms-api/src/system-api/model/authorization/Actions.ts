import { Authorizator } from '@contember/authorization'

namespace Actions {
	export enum Resources {
		project = 'project',
	}

	export const PROJECT_RELEASE_ANY: Authorizator.Action = [Resources.project, 'releaseAny']
	export const PROJECT_REBASE_ALL: Authorizator.Action = [Resources.project, 'rebaseAll']
}

export default Actions
