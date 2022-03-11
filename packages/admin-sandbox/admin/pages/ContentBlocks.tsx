import { Block, BlockRepeater, EditPage } from '@contember/admin'

export const ContentBlockPage = (
	<EditPage entity="ContentBlockPage(unique = One)" setOnCreate="(unique = One)">
		<BlockRepeater
			field="blocks"
			label="Block repeater"
			discriminationField="type"
			sortableBy="order"
		>
			<Block discriminateBy="heroSection" label="Hero section" />
		</BlockRepeater>
	</EditPage>
)
