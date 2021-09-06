import {
	ApiKeyList,
	ApplicationEntrypoint,
	Box,
	CreateApiKeyForm,
	CreateProjectForm,
	EditUser,
	GenericPage,
	Icon,
	InviteUser,
	Layout,
	LayoutInner,
	Menu,
	NavigateBackButton,
	Page,
	PageLinkButton,
	Pages,
	ProjectsGrid,
	runReactApp,
	TitleBar,
	UsersList,
} from '@contember/admin'
import './index.sass'
import { FC } from 'react'

const PanelLayout: FC = props => {
	return (
		<Layout
			children={props.children}
			sideBar={
				<Menu>
					<Menu.Item>
					<Menu.Item title={<><Icon blueprintIcon="chevron-left" style={{ verticalAlign: 'middle' }}/> back</>} href={'/'} />
				</Menu.Item>
				<Menu.Item title={'Contember Admin Panel'}>
						<Menu.Item title="Projects" to={'projectList'} />
					</Menu.Item>
				</Menu>
			}
		/>
	)
}

runReactApp(
	<ApplicationEntrypoint
		sessionToken={'__SESSION_TOKEN__'}
		apiBaseUrl={'/_api'}
		basePath={'/_panel/'}
		onInvalidIdentity={() => {
			window.location.href = '/'
		}}
		routes={{
			projectList: { path: '/' },
			projectCreate: { path: '/project/create' },
			projectOverview: { path: '/project/view/:project' },
			userInvite: { path: '/project/invite/:project' },
			identityEdit: { path: '/project/edit/:project/:identity' },
			apiKeyCreate: { path: '/project/api-key/:project' },
		}}
	>
		<Pages layout={PanelLayout}>
			<GenericPage pageName={'projectList'}>
				<TitleBar actions={<PageLinkButton to={'projectCreate'}>New project</PageLinkButton>}>
					Projects
				</TitleBar>
				<ProjectsGrid createProjectDetailLink={project => ({ pageName: 'projectOverview', parameters: { project } })} />
			</GenericPage>

			<GenericPage pageName={'projectCreate'}>
				<TitleBar navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}>
					New project
				</TitleBar>
				<CreateProjectForm projectListLink={'projectList'} />
			</GenericPage>

			<Page name="projectOverview">
				{({ project }: { project: string }) => (
					<LayoutInner>
						<TitleBar navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}>
							Project {project}
						</TitleBar>
						<div className={'projectMembers'}>
							<div className={'projectMembers-section'}>
								<Box
									heading={'Users'}
									actions={<PageLinkButton to={{ pageName: 'userInvite', parameters: { project } }}>Invite
										user</PageLinkButton>}
								>
									<UsersList
										project={project}
										createUserEditLink={identity => ({ pageName: 'identityEdit', parameters: { project, identity } })}
									/>
								</Box>
							</div>
							<div className={'projectMembers-section'}>
								<Box
									heading={'API keys'}
									actions={<PageLinkButton to={{ pageName: 'apiKeyCreate', parameters: { project } }}>Create API
										key</PageLinkButton>}
								>
									<ApiKeyList
										project={project}
										createApiKeyEditLink={identity => ({ pageName: 'identityEdit', parameters: { project, identity } })}
									/>
								</Box>
							</div>
						</div>
					</LayoutInner>
				)}
			</Page>

			<Page name="userInvite">
				{({ project }: { project: string }) => (
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
					</LayoutInner>
				)}
			</Page>

			<Page name="identityEdit">
				{({ project, identity }: { project: string, identity: string }) => (
					<LayoutInner>
						<TitleBar
							navigation={<NavigateBackButton
								to={{ pageName: 'projectOverview', parameters: { project } }}>Users</NavigateBackButton>}
						>
							Edit membership in project {project}
						</TitleBar>
						<EditUser
							project={project}
							identityId={identity}
							userListLink={{ pageName: 'projectOverview', parameters: { project } }}
						/>
					</LayoutInner>
				)}
			</Page>

			<Page name="apiKeyCreate">
				{({ project }: { project: string }) => (
					<LayoutInner>
						<TitleBar
							navigation={<NavigateBackButton
								to={{ pageName: 'projectOverview', parameters: { project } }}>Project</NavigateBackButton>}
						>
							Create API key for project {project}
						</TitleBar>
						<CreateApiKeyForm
							project={project}
							apiKeyListLink={{ pageName: 'projectOverview', parameters: { project } }}
						/>
					</LayoutInner>
				)}
			</Page>
		</Pages>
	</ApplicationEntrypoint>,
)
