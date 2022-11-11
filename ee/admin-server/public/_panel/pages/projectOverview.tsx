import { ApiKeyList, LayoutPage, LinkButton, NavigateBackButton, Section, useCurrentRequest, UsersList } from '@contember/admin'

export default () => {
	const request = useCurrentRequest()!
	const project = String(request.parameters.project)

	return (
		<LayoutPage
			title={`Project ${project}`}
			navigation={<NavigateBackButton to={'projectList'}>Projects</NavigateBackButton>}
		>
			<Section
				heading={'Users'}
				actions={<LinkButton distinction="seamless" to={{ pageName: 'userInvite', parameters: { project } }}>Invite user</LinkButton>}
			>
				<UsersList
					project={project}
					editUserLink={'identityEdit(identity: $identityId, project: $projectSlug)'}
				/>
			</Section>

			<Section
				heading={'API keys'}
				actions={<LinkButton distinction="seamless" to={{ pageName: 'apiKeyCreate', parameters: { project } }}>Create API key</LinkButton>}
			>
				<ApiKeyList
					project={project}
					editApiKeyLink={'identityEdit(identity: $identityId, project: $projectSlug)'}
				/>
			</Section>
		</LayoutPage>
	)
}
