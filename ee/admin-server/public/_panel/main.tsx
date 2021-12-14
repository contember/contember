import {
	ApiKeyList,
	ApplicationEntrypoint,
	Box,
	ChangePassword,
	CreateApiKeyForm,
	CreateProjectForm,
	EditIdentity,
	GenericPage,
	InviteUser,
	LayoutChrome,
	LayoutPage,
	Menu,
	NavigateBackButton,
	OtpManagement,
	Page,
	PageLinkButton,
	Pages,
	ProjectsGrid,
	runReactApp,
	TitleBar,
	UsersList,
} from '@contember/admin'
import { FC } from 'react'
import './index.sass'

const PanelLayout: FC = props => {
	return (
		<LayoutChrome
			children={props.children}
			navigation={
				<Menu>
					<Menu.Item>
						<Menu.Item
							title={<>
								<span>close Admin Panel</span>
							</>}
							href={'/'}
						/>
					</Menu.Item>
					<Menu.Item title={'Contember Admin Panel'}>
						<Menu.Item title="Projects" to={'projectList'} />
						<Menu.Item title="Profile security" to={'security'} />
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
			security: { path: '/security' },
		}}
	>
		<Pages layout={PanelLayout}>
			<GenericPage
				actions={<PageLinkButton to={'projectCreate'}>New project</PageLinkButton>}
				pageName={'projectList'}
				title="Projects"
			>
				<ProjectsGrid createProjectDetailLink={project => ({ pageName: 'projectOverview', parameters: { project } })} />
			</GenericPage>

			<GenericPage
				navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}
				pageName={'projectCreate'}
				title="New project"
			>
				<CreateProjectForm projectListLink={'projectList'} />
			</GenericPage>

			<Page name="projectOverview">
				{({ project }: { project: string }) => (
					<LayoutPage
						navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}
						title={`Project ${project}`}
					>
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
					</LayoutPage>
				)}
			</Page>

			<Page name="userInvite">
				{({ project }: { project: string }) => (
					<LayoutPage
						navigation={<NavigateBackButton
							to={{ pageName: 'projectOverview', parameters: { project } }}
						>Project</NavigateBackButton>}
						title={`Invite user to project ${project}`}
					>
						<InviteUser
							project={project}
							userListLink={{ pageName: 'projectOverview', parameters: { project } }}
						/>
					</LayoutPage>
				)}
			</Page>

			<Page name="identityEdit">
				{({ project, identity }: { project: string, identity: string }) => (
					<LayoutPage
						navigation={<NavigateBackButton
							to={{ pageName: 'projectOverview', parameters: { project } }}
						>Users</NavigateBackButton>}
						title={`Edit membership in project ${project}`}
					>
						<EditIdentity
							project={project}
							identityId={identity}
							userListLink={{ pageName: 'projectOverview', parameters: { project } }}
						/>
					</LayoutPage>
				)}
			</Page>

			<Page name="apiKeyCreate">
				{({ project }: { project: string }) => (
					<LayoutPage
						navigation={<NavigateBackButton
							to={{ pageName: 'projectOverview', parameters: { project } }}
						>Project</NavigateBackButton>}
						title={`Create API key for project ${project}`}
					>
						<CreateApiKeyForm
							project={project}
							apiKeyListLink={{ pageName: 'projectOverview', parameters: { project } }}
						/>
					</LayoutPage>
				)}
			</Page>

			<GenericPage pageName={'security'}>
				<TitleBar>
					Profile security
				</TitleBar>
				<ChangePassword />

				<Box heading={'Two-factor authentication'}>
					<OtpManagement />
				</Box>
			</GenericPage>
		</Pages>
	</ApplicationEntrypoint>,
)
