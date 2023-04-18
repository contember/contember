import { EditScope, Link } from '@contember/admin'
import { NavigateBackLink } from '@contember/cms-layout'
import { Back, Content, Title } from '../components/Layout'

export default () => (
	<EditScope entity="UploadShowcase(unique = One)" setOnCreate="(unique = One)">
		<Back>
			<NavigateBackLink to="index" />
		</Back>
		<Title>Second screen</Title>
		<Content>
			There is nothing here yet.
		</Content>
	</EditScope>
)
