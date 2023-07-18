import { EditScope, NavigateBackLink } from '@contember/admin'
import { SlotSources } from '../components/Slots'

export default () => (
	<EditScope entity="UploadShowcase(unique = One)" setOnCreate="(unique = One)">
		<SlotSources.Back>
			<NavigateBackLink to="index" />
		</SlotSources.Back>
		<SlotSources.Title>Second screen</SlotSources.Title>

		There is nothing here yet.
	</EditScope>
)
