import { Project } from '../../type/index.js'

export const getPreferredProject = (projects: Project[], preferredProjectSlug: string | null): Project | null => {
	if (projects.length === 1) {
		return projects[0]
	}
	if (preferredProjectSlug) {
		return projects.find(it => it.slug === preferredProjectSlug) || null
	}
	return null
}
