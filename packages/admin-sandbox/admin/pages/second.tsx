import { EditScope, NavigateBackLink } from '@contember/admin'
import { SlotSources, Title } from '../components/Slots'

export default () => (
	<EditScope entity="UploadShowcase(unique = One)" setOnCreate="(unique = One)">
		<SlotSources.Back>
			<NavigateBackLink to="index" />
		</SlotSources.Back>
		<Title>Second screen</Title>

		There is nothing here yet.
	</EditScope>
)
