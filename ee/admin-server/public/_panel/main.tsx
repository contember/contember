import {
	AnchorButton,
	ApiKeyList,
	ApplicationEntrypoint,
	Box,
	ChangePassword,
	ContemberLogoImage,
	CreateApiKeyForm,
	CreateProjectForm,
	Divider,
	EditIdentity,
	GenericPage,
	Heading,
	InviteUser,
	Layout,
	LayoutPage, LinkButton,
	Logo,
	Menu,
	NavigateBackButton,
	OtpManagement,
	Page, Pages,
	ProjectsGrid,
	RoutingLink,
	runReactApp, Section, Stack, UsersList,
} from '@contember/admin'
import { FC } from 'react'
import './index.sass'

const PanelLayout: FC = props => {
	return (
		<Layout
			children={props.children}
			sidebarHeader={
				<RoutingLink to="projectList">
					<Logo image={<ContemberLogoImage withLabel />} />
				</RoutingLink>
			}
			sidebarFooter={
				<AnchorButton
					distinction="seamless"
					href="/"
					justification="justifyStart"
				>&larr; Close Admin Panel</AnchorButton>
			}
			navigation={
				<Menu>
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
				actions={<LinkButton to={'projectCreate'} distinction="primary">New project</LinkButton>}
				pageName={'projectList'}
				title="Projects"
			>
				<ProjectsGrid createProjectDetailLink={project => ({ pageName: 'projectOverview', parameters: { project } })} />
			</GenericPage>

			<GenericPage
				navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}
				pageName={'projectCreate'}
				title="Create new project"
			>
				<CreateProjectForm projectListLink={'projectList'} />
			</GenericPage>

			<Page name="projectOverview">
				{({ project }: { project: string }) => (
					<LayoutPage
						navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}
						title={`Project ${project}`}
					>
						<Section
							heading={'Users'}
							actions={<LinkButton distinction="seamless" to={{ pageName: 'userInvite', parameters: { project } }}>Invite user</LinkButton>}
						>
							<UsersList
								project={project}
								createUserEditLink={identity => ({ pageName: 'identityEdit', parameters: { project, identity } })}
							/>
						</Section>
						<Section
							heading={'API keys'}
							actions={<LinkButton distinction="seamless" to={{ pageName: 'apiKeyCreate', parameters: { project } }}>Create API key</LinkButton>}
						>
							<ApiKeyList
								project={project}
								createApiKeyEditLink={identity => ({ pageName: 'identityEdit', parameters: { project, identity } })}
							/>
						</Section>
					</LayoutPage>
				)}
			</Page>

			<Page name="userInvite">
				{({ project }: { project: string }) => (
					<LayoutPage
						navigation={<NavigateBackButton to={{ pageName: 'projectOverview', parameters: { project } }}>Project</NavigateBackButton>}
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
						navigation={<NavigateBackButton to={{ pageName: 'projectOverview', parameters: { project } }}>Users</NavigateBackButton>}
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
						navigation={<NavigateBackButton to={{ pageName: 'projectOverview', parameters: { project } }}>Project</NavigateBackButton>}
						title={`Create API key for project ${project}`}
					>
						<CreateApiKeyForm
							project={project}
							apiKeyListLink={{ pageName: 'projectOverview', parameters: { project } }}
						/>
					</LayoutPage>
				)}
			</Page>

			<GenericPage pageName={'security'} title="Profile security">
				<Stack direction="vertical" gap="xlarge">
					<ChangePassword />

					<Divider />

					<Heading depth={3}>Two-factor authentication</Heading>
					<Box >
						<OtpManagement />
					</Box>
				</Stack>
			</GenericPage>
		</Pages>
	</ApplicationEntrypoint>,
)
