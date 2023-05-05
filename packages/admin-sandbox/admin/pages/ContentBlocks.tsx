import { Block, BlockRepeater, EditScope } from '@contember/admin'
import { Title } from '../components/Directives'

export const ContentBlockPage = (
	<EditScope entity="ContentBlockPage(unique = One)" setOnCreate="(unique = One)">
		<Title>Edit Content Block</Title>
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
