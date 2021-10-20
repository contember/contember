import {
	Block,
	BlockEditor,
	BlockEditorProps,
	CheckboxField,
	Component,
	HasOne,
	horizontalRuleToolbarButton,
	ImageUploadField,
	orderedListToolbarButton,
	paragraphNumberedToolbarButton,
	paragraphToolbarButton,
	RichEditor,
	RichTextField,
	scrollTargetToolbarButton,
	SelectField,
	tableToolbarButton,
	TextField,
	unorderedListToolbarButton,
} from '@contember/admin'

const RB = RichEditor.buttons
export const fullEditorInlineButtons: BlockEditorProps['inlineButtons'] = [
	[RB.bold, RB.italic, RB.underline, RB.anchor],
	[RB.headingOne, RB.headingTwo, RB.headingThree, RB.headingFour, RB.unorderedList, RB.orderedList],
	[RB.strikeThrough, RB.code],
]

export interface ContentFieldProps {
	field: string
}

const homepageSpecificBlockButtons: NonNullable<BlockEditorProps['blockButtons']> = [
	{
		blueprintIcon: 'citation',
		discriminateBy: 'quote',
		title: 'Quote',
	},
]

export const ContentField = Component<ContentFieldProps>(
	({ field }) => (
		<HasOne field={field}>
			<BlockEditor
				referencesField="references"
				referenceDiscriminationField="type"
				field="blocks"
				inlineButtons={fullEditorInlineButtons}
				label="Content"
				contentField="json"
				sortableBy="order"
				blockButtons={[
					{
						blueprintIcon: 'media',
						discriminateBy: 'image',
						title: 'Image',
					},
					{
						blueprintIcon: 'citation',
						discriminateBy: 'quote',
						title: 'Quote',
					},
					tableToolbarButton,
					scrollTargetToolbarButton,
					paragraphToolbarButton,
					paragraphNumberedToolbarButton,
					horizontalRuleToolbarButton,
				]}
			>
				<Block discriminateBy="image" label="Image">
					<BlockEditor.ContentOutlet placeholder="Text" />
					<ImageUploadField
						label="Image"
						baseEntity="image"
						urlField="url"
						widthField="width"
						heightField="height"
						fileSizeField="size"
						fileTypeField="type"
					/>
				</Block>
				<Block discriminateBy="quote" label="Quote">
					<TextField field="primaryText" label="Quote" />
					<TextField field="secondaryText" label="Author" />
				</Block>
			</BlockEditor>
		</HasOne>
	),
	'ContentField',
)
