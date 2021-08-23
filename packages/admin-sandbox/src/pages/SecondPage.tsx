import { EditPage, PageLink } from '@contember/admin'

export const SecondPage = (
	<EditPage pageName="second" entity="UploadShowcase(unique = One)">
		<PageLink to="dashboard">DASHBOARD</PageLink>
	</EditPage>
)
