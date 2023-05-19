import { EditScope, NavigateBackLink } from '@contember/admin'
import { Title } from '../components/Directives'
import { Slots } from '../components/Slots'

export default () => (
	<EditScope entity="UploadShowcase(unique = One)" setOnCreate="(unique = One)">
		<Slots.Back>
			<NavigateBackLink to="index" />
		</Slots.Back>
		<Title>Second screen</Title>
		<Slots.Content>
			There is nothing here yet.
		</Slots.Content>
	</EditScope>
)
