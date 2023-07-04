import { EditScope, NavigateBackLink } from '@contember/admin'
import { Title } from '../components/Directives'
import { SlotSources } from '../components/Slots'

export default () => (
	<EditScope entity="UploadShowcase(unique = One)" setOnCreate="(unique = One)">
		<SlotSources.Back>
			<NavigateBackLink to="index" />
		</SlotSources.Back>
		<Title>Second screen</Title>

		There is nothing here yet.
	</EditScope>
)
