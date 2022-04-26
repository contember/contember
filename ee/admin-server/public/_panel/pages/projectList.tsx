import { LayoutPage, LinkButton, ProjectsGrid, useIdentity } from '@contember/admin'

export default () => {
	const identity = useIdentity()
	const actions = identity.permissions.canCreateProject
		? <LinkButton to="projectCreate" distinction="primary">New project</LinkButton>
		: null

	return (
		<LayoutPage
			title="Projects"
			actions={actions}
			children={(
				<ProjectsGrid
					createProjectDetailLink={project => ({ pageName: 'projectOverview', parameters: { project } })}
				/>
			)}
		/>
	)
}
