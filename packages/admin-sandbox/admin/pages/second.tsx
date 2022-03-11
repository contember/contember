import { EditPage, Link } from '@contember/admin'

export default () => (
	<EditPage entity="UploadShowcase(unique = One)" setOnCreate="(unique = One)">
		<Link to="index">DASHBOARD</Link>
	</EditPage>
)
