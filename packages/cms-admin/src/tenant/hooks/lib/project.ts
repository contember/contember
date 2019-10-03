import { useSelector } from 'react-redux'
import State from '../../../state'

export const useProjectSlug = (): string | undefined => {
	return useSelector<State, string | undefined>(state => {
		const route = state.view.route
		return route != null && route.name === 'project_page' ? route.project : undefined
	})
}
