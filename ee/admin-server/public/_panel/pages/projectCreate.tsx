import { CreateProjectForm, Heading, LayoutPage, NavigateBackButton } from '@contember/admin'

export default () => (
	<LayoutPage
		title={<Heading depth={1}>Create new project</Heading>}
		navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}
		children={<CreateProjectForm projectListLink={'projectList'} />}
	/>
)
