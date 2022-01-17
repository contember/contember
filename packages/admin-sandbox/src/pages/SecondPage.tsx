import { EditPage, Link } from '@contember/admin'

export const SecondPage = (
	<EditPage pageName="second" entity="UploadShowcase(unique = One)" setOnCreate="(unique = One)">
		<Link to="index">DASHBOARD</Link>
	</EditPage>
)
