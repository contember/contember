import { InviteUser, LayoutPage, NavigateBackButton, useCurrentRequest } from '@contember/admin'

export default () => {
	const request = useCurrentRequest()!
	const project = request.parameters.project!

	return (
		<LayoutPage
			title={`Invite user to project ${project}`}
			navigation={<NavigateBackButton to={{ pageName: 'projectOverview', parameters: { project } }}>Project</NavigateBackButton>}
		>
			<InviteUser
				project={project}
				userListLink={{ pageName: 'projectOverview', parameters: { project } }}
			/>
		</LayoutPage>
	)
}
