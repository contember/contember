import { Binding, PersistButton } from '@app/lib/binding'
import { Slots } from '@app/lib/layout'
import * as React from 'react'
import { Component, EntitySubTree, FieldView, HasMany, HasOne, useEntity } from '@contember/interface'
import {
	Block,
	BlockEditor,
	EditorElementTrigger,
	EditorGenericTrigger,
	EditorInlineReferencePortal,
	EditorMarkTrigger,
	EditorReferenceTrigger,
	EditorWrapNodeTrigger,
	EmbedHandlers,
	referenceElementType,
} from '@contember/react-slate-editor-legacy'
import { Toggle } from '@app/lib/ui/toggle'
import {
	AlignCenterIcon,
	AlignJustifyIcon,
	AlignLeftIcon,
	AlignRightIcon,
	BoldIcon,
	CodeIcon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	HighlighterIcon,
	ImageIcon,
	ItalicIcon,
	Link2Icon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	LocateIcon,
	MinusIcon,
	PilcrowIcon,
	QuoteIcon,
	StrikethroughIcon,
	TableIcon,
	TrashIcon,
	UnderlineIcon,
} from 'lucide-react'
import {
	anchorElementType,
	boldMark,
	codeMark,
	createAlignHandler,
	EditorRenderElementProps,
	EditorTransforms,
	headingElementType,
	highlightMark,
	horizontalRuleElementType,
	italicMark,
	orderedListElementType,
	paragraphElementType,
	scrollTargetElementType,
	strikeThroughMark,
	tableElementType,
	underlineMark,
	unorderedListElementType,
} from '@contember/react-slate-editor'
import { ImageField, InputField } from '@app/lib/form'
import { Popover, PopoverContent, PopoverTrigger } from '@app/lib/ui/popover'
import { Button } from '@app/lib/ui/button'
import { PopoverClose } from '@radix-ui/react-popover'
import { uic } from '@app/lib/utils'
import { useSlateStatic } from 'slate-react'
import { baseEditorPlugins, EditorBlockToolbar, EditorInlineToolbar } from '@app/lib/editor'
import { BlockEditorField } from '../../lib-extra/legacy-editor/BlockEditor'


const BlockButton = uic('button', {
	baseClass: 'bg-white p-2 inline-flex flex-col hover:bg-gray-100 border rounded-md w-32 items-center justify-center',
})

const plugins = baseEditorPlugins

export const blocks = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'LegacyEditorContent(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<div className={'space-y-4'}>
				<BlockEditorField
					field={'blocks'}
					contentField="data"
					referencesField="references"
					referenceDiscriminationField="type"
					sortableBy="order"
					embedReferenceDiscriminateBy="embed"
					embedContentDiscriminationField="embed.type"
					embedHandlers={[
						new EmbedHandlers.YouTube({
							discriminateBy: 'youtube',
							youTubeIdField: 'embed.youtubeId',
						}),
						new EmbedHandlers.Vimeo({
							discriminateBy: 'vimeo',
							vimeoIdField: 'embed.vimeoId',
						}),
					]}
					plugins={[
						plugins.anchor,
						plugins.paragraph,
						plugins.heading,
						plugins.list,
						plugins.horizontalRule,
						plugins.scrollTarget,
						plugins.table,
						plugins.bold,
						plugins.code,
						plugins.highlight,
						plugins.italic,
						plugins.newline,
						plugins.strikeThrough,
						plugins.underline,
						editor => {
							editor.registerElement({
								type: 'link',
								isInline: true,
								render: LinkElement,
							})
						},
					]}
				>
					<EditorBlockToolbar>
						<EditorReferenceTrigger referenceType="quote"><BlockButton><QuoteIcon /> Quote</BlockButton></EditorReferenceTrigger>
						<EditorReferenceTrigger referenceType="image"><BlockButton><ImageIcon /> Image</BlockButton></EditorReferenceTrigger>
						<EditorElementTrigger elementType={tableElementType}><BlockButton><TableIcon /> Table</BlockButton></EditorElementTrigger>
						<EditorElementTrigger elementType={scrollTargetElementType}><BlockButton><LocateIcon /> Scroll target</BlockButton></EditorElementTrigger>
						<EditorElementTrigger elementType={horizontalRuleElementType}><BlockButton><MinusIcon /> Horizontal rule</BlockButton></EditorElementTrigger>
					</EditorBlockToolbar>
					<EditorInlineToolbar>
						<div>
							<EditorMarkTrigger mark={boldMark}><Toggle><BoldIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
							<EditorMarkTrigger mark={italicMark}><Toggle><ItalicIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
							<EditorMarkTrigger mark={underlineMark}><Toggle><UnderlineIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
							<EditorMarkTrigger mark={strikeThroughMark}><Toggle><StrikethroughIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
							<EditorMarkTrigger mark={highlightMark}><Toggle><HighlighterIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
							<EditorMarkTrigger mark={codeMark}><Toggle><CodeIcon className="h-3 w-3" /></Toggle></EditorMarkTrigger>
							<EditorElementTrigger elementType={anchorElementType}><Toggle><Link2Icon className="h-3 w-3" /></Toggle></EditorElementTrigger>
							<Popover>
								<PopoverTrigger asChild>
									<Toggle><LinkIcon className="h-3 w-3" /></Toggle>
								</PopoverTrigger>
								<PopoverContent>
									<EditorInlineReferencePortal referenceType="link">
										<LinkField field="target" />
										<ConfirmReferenceButton />
									</EditorInlineReferencePortal>
								</PopoverContent>
							</Popover>
						</div>
						<div>
							<EditorElementTrigger elementType={paragraphElementType} suchThat={{ isNumbered: false }}><Toggle><PilcrowIcon className="h-3 w-3" /></Toggle></EditorElementTrigger>
							<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 1, isNumbered: false }}><Toggle><Heading1Icon className="h-3 w-3" /></Toggle></EditorElementTrigger>
							<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 2, isNumbered: false }}><Toggle><Heading2Icon className="h-3 w-3" /></Toggle></EditorElementTrigger>
							<EditorElementTrigger elementType={headingElementType} suchThat={{ level: 3, isNumbered: false }}><Toggle><Heading3Icon className="h-3 w-3" /></Toggle></EditorElementTrigger>
							<EditorElementTrigger elementType={unorderedListElementType}><Toggle><ListIcon className="h-3 w-3" /></Toggle></EditorElementTrigger>
							<EditorElementTrigger elementType={orderedListElementType}><Toggle><ListOrderedIcon className="h-3 w-3" /></Toggle></EditorElementTrigger>

							<EditorGenericTrigger {...createAlignHandler('start')}><Toggle className="ml-4"><AlignLeftIcon className="h-3 w-3" /></Toggle></EditorGenericTrigger>
							<EditorGenericTrigger {...createAlignHandler('end')}><Toggle><AlignRightIcon className="h-3 w-3" /></Toggle></EditorGenericTrigger>
							<EditorGenericTrigger {...createAlignHandler('center')}><Toggle><AlignCenterIcon className="h-3 w-3" /></Toggle></EditorGenericTrigger>
							<EditorGenericTrigger {...createAlignHandler('justify')}><Toggle><AlignJustifyIcon className="h-3 w-3" /></Toggle></EditorGenericTrigger>
						</div>
					</EditorInlineToolbar>
					<Block discriminateBy="quote" label="Quote">
						<BlockEditor.ContentOutlet placeholder="Type here..." />
					</Block>
					<Block discriminateBy="embed" label="Embed">
						<Block discriminateBy="spotify" label="Spotify" />
						<Block discriminateBy="youtube" label="YouTube" />
						<Block discriminateBy="vimeo" label="Vimeo" />
					</Block>
					<Block discriminateBy="image" label="Image">
						<ImageField baseField={'image'} urlField="url" />
					</Block>
				</BlockEditorField>
			</div>
			<EditorJson />
		</EntitySubTree>
	</Binding>
</>


const EditorJson = () => {

	return (
		<pre className="bg-gray-800 text-white p-4 mt-16">
			<HasMany field="blocks">
				<FieldView<string> field="data" render={data => JSON.stringify(JSON.parse(data.value!), null, 2)} />
			</HasMany>
		</pre>
	)
}

const ConfirmReferenceButton = () => {
	const reference = useEntity()

	return (
		<PopoverClose asChild>
			<EditorWrapNodeTrigger
				elementType={referenceElementType}
				suchThat={{ type: 'link', referenceId: reference.id }}
			>
				<Button>Insert</Button>
			</EditorWrapNodeTrigger>
		</PopoverClose>
	)
}


const LinkElement = (props: EditorRenderElementProps) => {
	const editor = useSlateStatic()
	return (
		<span {...props.attributes}>
			<span className="bg-gray-50 border-b border-b-blue-300">
				{props.children}
			</span>
			<span contentEditable={false}>
				<Popover
				>
					<PopoverTrigger asChild>
						<button className="hover:bg-gray-200 p-1.5 border rounded"><LinkIcon className="w-2 h-2" /></button>
					</PopoverTrigger>
					<PopoverContent>
						<div className="flex gap-2 items-center">
							<LinkField field="target" />

							<Button onClick={() => EditorTransforms.unwrapNodes(editor, { at: [], match: node => node === props.element })} variant="destructive" size="sm">
								<TrashIcon className="w-3 h-3" />
							</Button>
						</div>
					</PopoverContent>
				</Popover>
			</span>
		</span>
	)
}


export const LinkField = Component<{ field: string }>(({ field }) => {
	return (
		<HasOne field={field}>
			<InputField field="url" />
		</HasOne>
	)
})
