import Authorizator from '../../../core/authorization/Authorizator'

namespace Actions {
	export enum Resources {
		project = 'project',
	}

	export const PROJECT_RELEASE_ANY: Authorizator.Action = [Resources.project, 'releaseAny']
}

export default Actions
