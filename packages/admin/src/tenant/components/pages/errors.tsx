export const createNotInProjectError = (): Error => {
	return new Error('This component can be only used in a project context. Wrap it in <ProjectSlugProvider/>.')
}
