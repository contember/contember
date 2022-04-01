import { BlockEditor, CreatePage, Layout, RichEditor, TextField } from '../../../src'

export default function() {
	return (
		<Layout>
			<CreatePage entity="Article">
				<BlockEditor
					contentField="json"
					field="content.blocks"
					label="Content"
					sortableBy="order"
				/>
			</CreatePage>
		</Layout>
	)
}


export const inlineButtonsOrderedList = function() {
	return (
		<Layout>
			<CreatePage entity="Article">
				<BlockEditor
					contentField="json"
					field="content.blocks"
					label="Content"
					sortableBy="order"
					inlineButtons={[
						RichEditor.buttons.orderedList,
						{
							...RichEditor.buttons.orderedList,
							suchThat: { numbering: null },
						},
						{
							...RichEditor.buttons.orderedList,
							suchThat: { numbering: 'official' },
						},
					]}
				/>
			</CreatePage>
		</Layout>
	)
}



export const inlineButtonsUnorderedList = function() {
	return (
		<Layout>
			<CreatePage entity="Article">
				<BlockEditor
					contentField="json"
					field="content.blocks"
					label="Content"
					sortableBy="order"
					inlineButtons={[
						RichEditor.buttons.unorderedList,
						{
							...RichEditor.buttons.unorderedList,
							suchThat: { numbering: null },
						},
						{
							...RichEditor.buttons.unorderedList,
							suchThat: { numbering: 'official' },
						},
					]}
				/>
			</CreatePage>
		</Layout>
	)
}
