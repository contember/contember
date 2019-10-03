import { useSelector } from 'react-redux'
import State from '../state'

export interface ProjectAndStage {
	project: string
	stage: string
}

export const useProjectAndStage = () =>
	useSelector<State, ProjectAndStage | undefined>(state => {
		const route = state.view.route
		if (route !== null && route.name === 'project_page') {
			return { project: route.project, stage: route.stage }
		}
		return undefined
	})
