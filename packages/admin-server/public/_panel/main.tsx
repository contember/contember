import * as ReactDOM from 'react-dom'
import {
	ApplicationEntrypoint,
	CreateProjectForm,
	EditUser,
	GenericPage,
	InviteUser,
	Layout,
	LayoutInner,
	Menu,
	NavigateBackButton,
	Page,
	PageLinkButton,
	Pages,
	ProjectsGrid,
	TitleBar,
	UsersList,
} from '@contember/admin'
import './index.sass'
import { FC } from 'react'


const PanelLayout: FC = props => {
	return (
		<Layout
			children={props.children}
			sideBar={<Menu>
				<Menu.Item title={'Contember Admin Panel'}>
					<Menu.Item title="Projects" to={'projectList'} />
				</Menu.Item>
			</Menu>}
		/>
	)
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
				projectList: { path: '/' },
				projectCreate: { path: '/project/create' },
				projectOverview: { path: '/project/view/:project' },
				userInvite: { path: '/project/invite/:project' },
				userEdit: { path: '/project/invite/:project/:user' },
			}}
			children={<Pages layout={PanelLayout} children={[
				<GenericPage pageName={'projectList'}>
					<TitleBar actions={<PageLinkButton to={'projectCreate'}>New project</PageLinkButton>}>
						Projects
					</TitleBar>
					<ProjectsGrid
						createProjectDetailLink={project => ({ pageName: 'projectOverview', parameters: { project } })} />
				</GenericPage>,
				<GenericPage pageName={'projectCreate'}>
					<TitleBar navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}>
						New project
					</TitleBar>
					<CreateProjectForm projectListLink={'projectList'} />
				</GenericPage>,
				<Page name="projectOverview">
					{({ project }: { project: string }) =>
						<LayoutInner>
							<TitleBar
								navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}
								actions={<PageLinkButton to={{ pageName: 'userInvite', parameters: { project } }}>Invite
									user</PageLinkButton>}
							>
								Project {project}
							</TitleBar>
							<UsersList
								project={project}
								createUserEditLink={user => ({ pageName: 'userEdit', parameters: { project, user } })}
							/>
						</LayoutInner>}
				</Page>,
				<Page name="userInvite">
					{({ project }: { project: string }) =>
						<LayoutInner>
							<TitleBar
								navigation={<NavigateBackButton
									to={{ pageName: 'projectOverview', parameters: { project } }}>Project</NavigateBackButton>}
							>
								Invite user to project {project}
							</TitleBar>
							<InviteUser
								project={project}
								userListLink={{ pageName: 'projectOverview', parameters: { project } }}
							/>
						</LayoutInner>}
				</Page>,
				<Page name="userEdit">
					{({ project, user }: { project: string, user: string }) =>
						<LayoutInner>
							<TitleBar
								navigation={<NavigateBackButton
									to={{ pageName: 'projectOverview', parameters: { project } }}>Users</NavigateBackButton>}
							>
								Edit user in project {project}
							</TitleBar>
							<EditUser
								project={project}
								identityId={user}
								userListLink={{ pageName: 'projectOverview', parameters: { project } }}
							/>
						</LayoutInner>}
				</Page>,
			]} />}
		/>,
		document.getElementById('root'),
	)
})
