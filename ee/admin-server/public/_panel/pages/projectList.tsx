import { LayoutPage, LinkButton, ProjectsGrid } from '@contember/admin'

export default () => (
	<LayoutPage
		title="Projects"
		actions={<LinkButton to="projectCreate" distinction="primary">New project</LinkButton>}
		children={<ProjectsGrid createProjectDetailLink={project => ({ pageName: 'projectOverview', parameters: { project } })} />}
	/>
)
