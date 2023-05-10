import { EditScope, NavigateBackLink } from '@contember/admin'
import { Title } from '../components/Directives'
import { Back, Content } from '../components/Slots'

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
