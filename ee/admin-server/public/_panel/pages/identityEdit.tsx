import { EditIdentity, Heading, LayoutPage, NavigateBackButton, Page } from '@contember/admin'

export default (
	<Page name="identityEdit">
		{({ project, identity }: { project: string, identity: string }) => (
			<LayoutPage
				navigation={<NavigateBackButton to={{ pageName: 'projectOverview', parameters: { project } }}>Users</NavigateBackButton>}
				title={<Heading depth={1}>Edit membership in project {project}</Heading>}
			>
				<EditIdentity
					project={project}
					identityId={identity}
					userListLink={{ pageName: 'projectOverview', parameters: { project } }}
				/>
			</LayoutPage>
		)}
	</Page>
)
