import { useIdentity } from '../components'
import { useMemo } from 'react'
import { useProjectSlug } from '@contember/react-client'

export type ProjectUserRoles = Set<string>

export const useProjectUserRoles = (): ProjectUserRoles => {
	const identity = useIdentity()
	const projectSlug = useProjectSlug()
	return useMemo(() => {
		if (!projectSlug) {
			return new Set()
		}
		const targetProject = identity.projects.find(project => project.slug === projectSlug)
		if (targetProject === undefined) {
			return new Set()
		}

		return new Set(targetProject.roles)
	}, [identity.projects, projectSlug])
}
