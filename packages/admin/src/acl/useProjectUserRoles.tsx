import { shallowEqual, useSelector } from 'react-redux'
import State from '../state'

export type ProjectUserRoles = Set<string>

export const useProjectUserRoles = () => {
	return useSelector<State, ProjectUserRoles>(state => {
		if (state.request.name !== 'project_page' || !state.auth.identity) {
			return new Set()
		}
		const projectSlug = state.request.project
		const targetProject = state.auth.identity.projects.find(project => project.slug === projectSlug)

		if (targetProject === undefined) {
			return new Set()
		}

		return new Set(targetProject.roles)
	}, shallowEqual)
}
