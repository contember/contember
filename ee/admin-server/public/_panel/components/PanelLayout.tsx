import {
	AnchorButton,
	ContemberLogoImage,
	DataBindingProvider,
	FeedbackRenderer,
	Layout,
	Logo,
	Menu,
	ProjectSlugContext,
	RoutingLink,
	Select,
	StageSlugContext,
	useCurrentRequest,
	useIdentity,
	useRedirect,
} from '@contember/admin'
import { ReactNode } from 'react'
import { StudioNavigation } from './StudioNavigation'

export interface PanelLayoutProps {
	children?: ReactNode
}

export const PanelLayout = (props: PanelLayoutProps) => {
	const request = useCurrentRequest()!
	const redirect = useRedirect()
	const projectOptions = useIdentity().projects.map(it => ({ value: it.slug, label: it.name }))
	const project = request.parameters.project as string | undefined

	const onProjectChange = (projectSlug: string | null | undefined) => {
		if (typeof projectSlug === 'string') {
			redirect({ pageName: 'projectOverview', parameters: { project: projectSlug } })
		}
	}

	return (
		<ProjectSlugContext.Provider value={project}>
			<StageSlugContext.Provider value="live">
				<Layout
					children={props.children}
					sidebarHeader={
						<RoutingLink to="projectList">
							<Logo image={<ContemberLogoImage withLabel />} />
						</RoutingLink>
					}
					sidebarFooter={
						project === undefined && (
							<AnchorButton distinction="seamless" href="/" justification="justifyStart">
								&larr; Close Admin Panel
							</AnchorButton>
						)
					}
					navigation={
						<>
							{project === undefined && (
								<Menu>
									<Menu.Item title={'Contember Admin Panel'}>
										<Menu.Item title="Projects" to={'projectList'} />
										<Menu.Item title="Profile security" to={'security'} />
									</Menu.Item>
								</Menu>
							)}

							{project !== undefined && (
								<DataBindingProvider stateComponent={FeedbackRenderer}>
									{projectOptions.length > 1 && (
										<div style={{ marginLeft: 'var(--cui-edge-offset-left)', padding: '0 var(--cui-padding-left)' }}>
											<Select
												options={projectOptions}
												value={project}
												notNull
												onChange={onProjectChange}
											/>
										</div>
									)}

									<Menu>
										<Menu.Item title="Tenant">
											<Menu.Item title="Overview" to={{ pageName: 'projectOverview', parameters: { project } }} />
											<Menu.Item title="Invite User" to={{ pageName: 'userInvite', parameters: { project } }} />
											<Menu.Item title="Create API key" to={{ pageName: 'apiKeyCreate', parameters: { project } }} />
										</Menu.Item>
										<StudioNavigation project={project} />
									</Menu>
								</DataBindingProvider>
							)}
						</>
					}
				/>
			</StageSlugContext.Provider>
		</ProjectSlugContext.Provider>
	)
}
