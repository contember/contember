import * as ReactDOM from 'react-dom'
import {
	ApplicationEntrypoint,
	CreateProjectForm,
	GenericPage,
	Layout,
	LayoutInner,
	Menu,
	Page,
	Pages,
	ProjectOverview,
	ProjectsGrid,
} from '@contember/admin'
import './index.sass'
import { FC } from 'react'


const PanelLayout: FC = props => {
	return (
		<Layout
			children={props.children}
			topStart={'Contember Admin Panel'}
			sideBar={<Menu>
				<Menu.Item title="Dashboard" to={'dashboard'}/>
				<Menu.Item title="Create project" to={'projectCreate'}/>
			</Menu>}
		/>
	)
}

const ProjectOverviewPage = (props: {project: string}) => {
	return <LayoutInner>
		<ProjectOverview project={props.project} />
	</LayoutInner>
}

window.addEventListener('DOMContentLoaded', () => {
	const el = document.getElementById('contember-config')
	const config = JSON.parse(el?.innerHTML ?? '{}')

	ReactDOM.render(
		<ApplicationEntrypoint
			sessionToken={config.sessionToken}
			apiBaseUrl={config.apiBaseUrl}
			basePath={'/_panel/'}
			routes={{
				dashboard: { path: '/' },
				projectCreate: { path: '/project/create' },
				projectOverview: { path: '/project/:project' },
			}}
			children={<Pages layout={PanelLayout} children={[
				<GenericPage pageName={'dashboard'}>
					<ProjectsGrid/>
				</GenericPage>,
				<GenericPage pageName={'projectCreate'}>
					<TitleBar navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}>
						New project
					</TitleBar>
					<CreateProjectForm projectListLink={'projectList'} />
				</GenericPage>,
				<Page name="projectOverview">
					{ProjectOverviewPage}
				</Page>,
			]} />}
		/>,
		document.getElementById('root'),
	)
})
