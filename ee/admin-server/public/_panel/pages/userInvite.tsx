import { Heading, InviteMethod, InviteUser, LayoutPage, NavigateBackButton, useCurrentRequest, useEnvironment } from '@contember/admin'

export default () => {
	const request = useCurrentRequest()!
	const project = String(request.parameters.project)

	const env = useEnvironment()
	const inviteMethod = env.getVariableOrElse<undefined, InviteMethod>('inviteMethod', undefined)

	return (
		<LayoutPage
			title={<Heading depth={1}>Invite user to project {project}</Heading>}
			navigation={<NavigateBackButton to={{ pageName: 'projectOverview', parameters: { project } }}>Project</NavigateBackButton>}
		>
			<InviteUser
				project={project}
				userListLink={{ pageName: 'projectOverview', parameters: { project } }}
				method={inviteMethod}
			/>
		</LayoutPage>
	)
}
