import { Block, BlockRepeater, EditScope } from '@contember/admin'
import { SlotSources } from '../components/Slots'

export const ContentBlockPage = (
	<EditScope entity="ContentBlockPage(unique = One)" setOnCreate="(unique = One)">
		<SlotSources.Title>Edit Content Block</SlotSources.Title>
		<BlockRepeater
			field="blocks"
			label="Block repeater"
			discriminationField="type"
			sortableBy="order"
		>
			<Block discriminateBy="heroSection" label="Hero section" />
		</BlockRepeater>
	</EditScope>
)
