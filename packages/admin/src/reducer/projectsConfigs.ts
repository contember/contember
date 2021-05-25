import type { Reducer } from 'redux'
import { Action, handleActions } from 'redux-actions'
import ProjectConfigsState, { emptyProjectsConfigsState } from '../state/projectsConfigs'

export const PROJECT_CONFIGS_REPLACE = 'project_configs_replace'

export default handleActions<ProjectConfigsState, any>(
	{
		[PROJECT_CONFIGS_REPLACE]: (state, action: Action<ProjectConfigsState['configs']>) => {
			return { configs: action.payload } as ProjectConfigsState
		},
	},
	emptyProjectsConfigsState,
) as Reducer
