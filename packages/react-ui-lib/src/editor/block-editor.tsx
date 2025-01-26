import { Component, SugaredRelativeEntityList, SugaredRelativeSingleField } from '@contember/interface'
import { BlockEditor, BlockEditorProps, withReferences } from '@contember/react-slate-editor'
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	KeyboardSensor,
	MeasuringStrategy,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ReactNode, useCallback, useMemo } from 'react'
import { Transforms } from 'slate'
import { useSlate, useSlateStatic } from 'slate-react'
import { EditorCanvas, EditorEditableCanvas } from './common'
import { blockEditorPlugins } from './plugins'

export type BlockEditorFieldProps =
	& BlockEditorProps
	& {
		/** Field for storing related entities */
		referencesField: SugaredRelativeEntityList['field']
		/** Field for entity type discrimination */
		referenceDiscriminationField: SugaredRelativeSingleField['field']
		/** Editor placeholder text */
		placeholder?: string
	}

/**
 * BlockEditorField component - Rich text editor with drag-and-drop block management
 *
 * #### Purpose
 * Provides a structured content editing experience with sortable blocks and reference management
 *
 * #### Features
 * - Drag-and-drop block reordering
 * - Reference entity integration
 * - Slate.js editor core
 * - Plugin system extensibility
 * - Collision detection and measuring strategies
 *
 * #### Example: Basic usage
 * ```tsx
 * <BlockEditorField
 *   field="data"
 *   referencesField="references"
 *   referenceDiscriminationField="type"
 * >
 *   <EditorBlockToolbar>
 *     <EditorReferenceTrigger referenceType="image">
 *       <BlockButton><ImageIcon /> Image</BlockButton>
 *     </EditorReferenceTrigger>
 *   </EditorBlockToolbar>
 *
 *   <EditorBlock name="image" label="Image">
 *     <ImageField baseField="image" urlField="url" />
 *   </EditorBlock>
 * </BlockEditorField>
 * ```
 *
 * #### Example with custom plugins and toolbars (inline and block)
 * ```tsx
 * <BlockEditorField
 *   field="data"
 *   referencesField="references"
 *   referenceDiscriminationField="type"
 *   plugins={[
 *     editor => {
 *       editor.registerElement({
 *         type: 'link',
 *         isInline: true,
 *         render: LinkElement,
 *       })
 *     },
 *   ]}
 * >
 *   <EditorBlockToolbar>
 *     <EditorReferenceTrigger referenceType="image">
 *       <BlockButton>
 *         <ImageIcon /> Image
 *       </BlockButton>
 *     </EditorReferenceTrigger>
 *
 *     <EditorElementTrigger elementType={tableElementType}>
 *       <BlockButton>
 *         <TableIcon /> Table
 *       </BlockButton>
 *     </EditorElementTrigger>
 *
 *     <EditorElementTrigger elementType={scrollTargetElementType}>
 *       <BlockButton>
 *         <LocateIcon /> Scroll target
 *       </BlockButton>
 *     </EditorElementTrigger>
 *
 *     <EditorElementTrigger elementType={horizontalRuleElementType}>
 *       <BlockButton>
 *         <MinusIcon  /> Horizontal rule
 *       </BlockButton>
 *     </EditorElementTrigger>
 *   </EditorBlockToolbar>
 *
 *   <EditorInlineToolbar>
 *     <div>
 *       <EditorMarkTrigger mark={boldMark}>
 *           <Toggle><BoldIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorMarkTrigger mark={italicMark}>
 *         <Toggle><ItalicIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorMarkTrigger mark={underlineMark}>
 *         <Toggle><UnderlineIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorMarkTrigger mark={strikeThroughMark}>
 *         <Toggle><StrikethroughIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorMarkTrigger mark={highlightMark}>
 *         <Toggle><HighlighterIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorMarkTrigger mark={codeMark}>
 *         <Toggle><CodeIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorElementTrigger elementType={anchorElementType}>
 *         <Toggle><Link2Icon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <Popover>
 *         <PopoverTrigger asChild>
 *           <Toggle><LinkIcon className="h-3 w-3" /></Toggle>
 *         </PopoverTrigger>
 *         <PopoverContent>
 *           <EditorInlineReferencePortal referenceType="link">
 *             <LinkField field="link" />
 *             <ConfirmReferenceButton />
 *           </EditorInlineReferencePortal>
 *         </PopoverContent>
 *       </Popover>
 *     </div>
 *
 *     <div>
 *       <EditorElementTrigger elementType={paragraphElementType} suchThat={{ isNumbered: false }}>
 *         <Toggle><PilcrowIcon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorElementTrigger elementType={headingElementType} suchThat={{ level: 1, isNumbered: false }}>
 *         <Toggle><Heading1Icon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorElementTrigger elementType={headingElementType} suchThat={{ level: 2, isNumbered: false }}>
 *         <Toggle><Heading2Icon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorElementTrigger elementType={headingElementType} suchThat={{ level: 3, isNumbered: false }}>
 *         <Toggle><Heading3Icon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorElementTrigger elementType={unorderedListElementType}>
 *           <Toggle><ListIcon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorElementTrigger elementType={orderedListElementType}>
 *         <Toggle><ListOrderedIcon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorGenericTrigger {...createAlignHandler('start')}>
 *         <Toggle className="ml-4"><AlignLeftIcon className="h-3 w-3" /></Toggle>
 *       </EditorGenericTrigger>
 *
 *       <EditorGenericTrigger {...createAlignHandler('end')}>
 *         <Toggle><AlignRightIcon className="h-3 w-3" /></Toggle>
 *       </EditorGenericTrigger>
 *
 *       <EditorGenericTrigger {...createAlignHandler('center')}>
 *         <Toggle><AlignCenterIcon className="h-3 w-3" /></Toggle>
 *       </EditorGenericTrigger>
 *
 *       <EditorGenericTrigger {...createAlignHandler('justify')}>
 *         <Toggle><AlignJustifyIcon className="h-3 w-3" /></Toggle>
 *       </EditorGenericTrigger>
 *     </div>
 *   </EditorInlineToolbar>
 *
 *   <EditorBlock name="quote" label="Quote">
 *     <EditorBlockContent />
 *   </EditorBlock>
 *
 *   <EditorBlock name="image" label="Image">
 *     <ImageField baseField="image" urlField="url" />
 *   </EditorBlock>
 * </BlockEditorField>
 * ```
 *
 */
export const BlockEditorField = Component<BlockEditorFieldProps>(({ placeholder, children, ...props }) => {
	return (
		<BlockEditor {...props} plugins={[
			...blockEditorPlugins,
			...props.plugins ?? [],
			withReferences({
				field: props.referencesField,
				discriminationField: props.referenceDiscriminationField,
			}),
		]}>
			<SortableBlockEditor>
				<BlockEditorInner placeholder={placeholder}>
					{children}
				</BlockEditorInner>
			</SortableBlockEditor>
		</BlockEditor>
	)
})

const SortableBlockEditor = ({ children }: { children: ReactNode }) => {
	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(KeyboardSensor),
	)

	const editor = useSlate()
	const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
		if (!over) {
			return
		}
		const activeNodeIndex = editor.children.findIndex(it => it.key === active.id)
		const overNodeIndex = editor.children.findIndex(it => it.key === over.id)

		if (activeNodeIndex === undefined || overNodeIndex === undefined || activeNodeIndex === overNodeIndex) {
			return
		}
		Transforms.moveNodes(editor, {
			at: [activeNodeIndex],
			to: [overNodeIndex],
		})
	}, [editor])

	const items = useMemo(() => {
		return editor.children.map(it => it.key as string)
	}, [editor.children])

	return (
		<DndContext
			sensors={sensors}
			measuring={{
				droppable: {
					strategy: MeasuringStrategy.Always,
				},
			}}
			onDragEnd={onDragEnd}
			collisionDetection={closestCenter}
		>
			<SortableContext items={items} strategy={verticalListSortingStrategy}>
				{children}
			</SortableContext>
		</DndContext>
	)
}

export const BlockEditorInner = ({ children, placeholder }: {
	placeholder?: string
	children: ReactNode
}) => {
	const editor = useSlateStatic()

	return (
		<EditorCanvas
			underlyingComponent={EditorEditableCanvas}
			componentProps={{
				renderElement: editor.renderElement,
				renderLeaf: editor.renderLeaf,
				onKeyDown: editor.onKeyDown,
				onFocusCapture: editor.onFocus,
				onBlurCapture: editor.onBlur,
				onDOMBeforeInput: editor.onDOMBeforeInput,
				onDrop: (e => {
					e.preventDefault()
				}),
				placeholder: placeholder,
			}}

		>
			{children}
		</EditorCanvas>
	)
}
