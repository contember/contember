import { CreateProjectForm, LayoutPage, NavigateBackButton } from '@contember/admin'

export default () => (
	<LayoutPage
		title="Create new project"
		navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}
		children={<CreateProjectForm projectListLink={'projectList'} />}
	/>
)
