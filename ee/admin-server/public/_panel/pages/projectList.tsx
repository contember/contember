import { Heading, LayoutPage, LinkButton, ProjectsGrid, useIdentity } from '@contember/admin'

export default () => {
	const identity = useIdentity()
	const actions = identity.permissions.canCreateProject
		? <LinkButton to="projectCreate" distinction="primary" >New project</LinkButton>
		: null

	return (
		<LayoutPage
			title={<Heading depth={1}>Projects</Heading>}
			actions={actions}
			children={(
				<ProjectsGrid
					projectDetailLink={`projectOverview(project: $projectSlug)`}
				/>
			)}
		/>
	)
}
