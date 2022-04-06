import { EditIdentity, LayoutPage, NavigateBackButton, Page } from '@contember/admin'

export default (
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
)
