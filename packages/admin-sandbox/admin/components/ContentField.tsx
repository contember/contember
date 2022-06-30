import {
	Block,
	BlockEditor,
	BlockEditorProps,
	Component,
	horizontalRuleToolbarButton,
	ImageUploadField,
	paragraphNumberedToolbarButton,
	paragraphToolbarButton,
	RadioField,
	RichEditor,
	Scheme,
	scrollTargetToolbarButton,
	SelectField,
	tableToolbarButton,
	TextField,
} from '@contember/admin'
import * as React from 'react'
import { withAnchorsAsReference } from './AnchorInsertHandler'
import { InsertLink, LinkElement } from './customLinks'


const RB = RichEditor.buttons
export const fullEditorInlineButtons: BlockEditorProps['inlineButtons'] = [
	[RB.bold, RB.italic, RB.underline, RB.anchor],
	[RB.headingOne, RB.headingTwo, RB.headingThree, RB.headingFour, RB.unorderedList, RB.orderedList],
	[RB.alignStart, RB.alignCenter, RB.alignEnd, RB.alignJustify],
	[RB.strikeThrough, RB.code],
	[
		{
			discriminateBy: 'link',
			referenceContent: InsertLink,
			label: 'Insert link',
			title: 'Insert link',
			blueprintIcon: 'link',
		},
	],
]

export interface ContentFieldProps {
	field: string
	toolbarScheme?: Scheme
}

export const ContentField = Component<ContentFieldProps>(
	({ field, toolbarScheme }) => (
		<BlockEditor
			augmentEditorBuiltins={editor => {

				withAnchorsAsReference(
					editor,
					{
						elementType: 'link',
						updateReference: (url, getAccessor) => {
							getAccessor().getField('link.type').updateValue('external')
							getAccessor().getField('link.externalLink').updateValue(url)
						},
					},
				)

				editor.registerElement({
					type: 'link',
					isInline: true,
					render: LinkElement,
				})
			}}
			leadingFieldBackedElements={[
				{
					element: <TextField field={'title'} label={undefined} placeholder={'Title'} distinction="seamless-with-padding" />,
				},
				{
					field: 'lead',
					placeholder: 'Lead',
					format: 'richText',
					distinction: 'seamless-with-padding',
				},
			]}
			trailingFieldBackedElements={[
				{
					field: 'footer',
					placeholder: 'Footer',
					format: 'richText',
					distinction: 'seamless-with-padding',
				},
			]}
			referencesField="references"
			referenceDiscriminationField="type"
			field={`${field}.blocks`}
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
			toolbarScheme={toolbarScheme}
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
				<RadioField field={'align'} label={'Align'} options={[
					{ value: 'left', label: 'Left' },
					{ value: 'right', label: 'Right' },
					{ value: 'center', label: 'Center' },
				]} orientation={'horizontal'} />
				<SelectField field={'align	'} label={'Align'} options={[
					{ value: 'left', label: 'Left' },
					{ value: 'right', label: 'Right' },
					{ value: 'center', label: 'Center' },
				]} />
			</Block>
			<Block discriminateBy="quote" label="Quote">
				<BlockEditor.ContentOutlet />
				<TextField field="primaryText" label="Quote" />
				<TextField field="secondaryText" label="Author" />
			</Block>
		</BlockEditor>
	),
	'ContentField',
)
