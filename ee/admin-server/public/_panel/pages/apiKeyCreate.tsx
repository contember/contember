import { CreateApiKeyForm, Heading, LayoutPage, NavigateBackButton, Page } from '@contember/admin'

export default (
	<Page name="apiKeyCreate">
		{({ project }: { project: string }) => (
			<LayoutPage
				navigation={<NavigateBackButton to={{ pageName: 'projectOverview', parameters: { project } }}>Project</NavigateBackButton>}
				title={<Heading depth={1}>Create API key for project {project}</Heading>}
			>
				<CreateApiKeyForm
					project={project}
					apiKeyListLink={{ pageName: 'projectOverview', parameters: { project } }}
				/>
			</LayoutPage>
		)}
	</Page>
)
