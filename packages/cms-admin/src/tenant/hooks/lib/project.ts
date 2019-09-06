import { useSelector } from 'react-redux'
import State from '../../../state'
import { useGraphqlContentClient } from './client'

export const useProjectSlug = (): string | undefined => {
	return useSelector<State, string | undefined>(state => {
		const route = state.view.route
		return route != null && route.name === 'project_page' ? route.project : undefined
	})
}

interface UseProjectAndStageSlugReturn {
	project: string
	stage: string
}

export const useProjectAndStageSlug = (): UseProjectAndStageSlugReturn | undefined => {
	return useSelector<State, UseProjectAndStageSlugReturn | undefined>(state => {
		const route = state.view.route
		if (route != null && route.name === 'project_page') {
			return { project: route.project, stage: route.stage }
		} else {
			return undefined
		}
	})
}

export const useCurrentContentGraphqlClient = () => {
	const projectAndStage = useProjectAndStageSlug()
	if (projectAndStage === undefined) {
		throw new Error('No project and stage found.')
	}
	return useGraphqlContentClient(projectAndStage.project, projectAndStage.stage)
}
