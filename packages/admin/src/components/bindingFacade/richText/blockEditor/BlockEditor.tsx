import {
	BindingError,
	Component,
	Environment,
	FieldValue,
	HasMany,
	SugaredField,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useDesugaredRelativeSingleField,
	useEnvironment,
	VariableInputTransformer,
} from '@contember/binding'
import { emptyArray, noop, useReferentiallyStableCallback } from '@contember/react-utils'
import { EditorCanvas, EditorCanvasSize, FieldContainer, Scheme } from '@contember/ui'
import { Fragment, FunctionComponent, ReactElement, ReactNode, useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { SortEnd } from 'react-sortable-hoc'
import { Range as SlateRange, Transforms } from 'slate'
import { Slate } from 'slate-react'
import { getDiscriminatedBlock, useNormalizedBlocks } from '../../blocks'
import { Repeater, SortableRepeaterContainer } from '../../collections'
import { SugaredDiscriminateBy, useDiscriminatedData } from '../../discrimination'
import { TextareaField } from '../../fields'
import { shouldCancelStart } from '../../helpers/shouldCancelStart'
import { createEditorWithEssentials } from '../baseEditor'
import { EditableCanvas } from '../baseEditor/EditableCanvas'
import type { CreateEditorPublicOptions } from '../editorFactory'
import { paragraphElementType } from '../plugins'
import { RichEditor } from '../RichEditor'
import { RichTextField } from '../RichTextField'
import {
	HoveringToolbars,
	HoveringToolbarsProps,
	InitializeReferenceToolbarButton,
	ToolbarButtonSpec,
} from '../toolbars'
import { BlockHoveringToolbarContents, BlockHoveringToolbarContentsProps } from './BlockHoveringToolbarContents'
import { EditorWithBlocks, initBlockEditor } from './editor'
import type { EmbedHandler } from './embed'
import type { FieldBackedElement } from './FieldBackedElement'
import { useCreateElementReference } from './references'
import { ReferencesProvider } from './references/ReferencesProvider'
import { useGetReferencedEntity } from './references/useGetReferencedEntity'
import { useInsertElementWithReference } from './references/useInsertElementWithReference'
import { SortedBlocksContext } from './state/SortedBlocksContext'
import { useBlockEditorState } from './state/useBlockEditorState'
import { ContentOutlet, ContentOutletProps, useEditorReferenceBlocks } from './templating'

export interface BlockEditorProps extends SugaredRelativeEntityList, CreateEditorPublicOptions<EditorWithBlocks> {
	label?: ReactNode
	placeholder?: string
	contentField: SugaredFieldProps['field']
	sortableBy: SugaredFieldProps['field']
	children?: ReactNode
	size?: EditorCanvasSize

	leadingFieldBackedElements?: FieldBackedElement[]
	trailingFieldBackedElements?: FieldBackedElement[]

	referencesField?: SugaredRelativeEntityList | string
	referenceDiscriminationField?: SugaredFieldProps['field']
	monolithicReferencesMode?: boolean

	embedReferenceDiscriminateBy?: SugaredDiscriminateBy
	embedContentDiscriminationField?: SugaredFieldProps['field']
	embedHandlers?: Iterable<EmbedHandler>

	showToolbarLabels?: BlockHoveringToolbarContentsProps['showLabels']
	toolbarScheme?: Scheme

	// TODO
	inlineButtons?: HoveringToolbarsProps['inlineButtons']
	blockButtons?: BlockHoveringToolbarContentsProps['blockButtons']
	otherBlockButtons?: BlockHoveringToolbarContentsProps['otherBlockButtons']
}

const BlockEditorComponent: FunctionComponent<BlockEditorProps> = Component(
	props => {
		const environment = useEnvironment()

		assertStaticBlockEditorInvariants(props, environment)

		const {
			contentField,
			label,
			placeholder,
			sortableBy,
			children,
			size,

			leadingFieldBackedElements = emptyArray,
			trailingFieldBackedElements = emptyArray,

			referencesField,
			referenceDiscriminationField,
			monolithicReferencesMode = false,

			embedReferenceDiscriminateBy,
			embedContentDiscriminationField,
			embedHandlers = emptyArray,

			toolbarScheme,

			inlineButtons = defaultInlineButtons,
			blockButtons,
			otherBlockButtons,
			showToolbarLabels,

			plugins,
			augmentEditor,
			augmentEditorBuiltins,

			...blockListProps
		} = props
		// const desugaredReferenceList = useDesugaredRelativeEntityList(referencesField)
		const desugaredReferenceDiscriminationField = useDesugaredRelativeSingleField(referenceDiscriminationField)
		const desugaredEmbedContentDiscriminationField = useDesugaredRelativeSingleField(embedContentDiscriminationField)


		const editorReferenceBlocks = useEditorReferenceBlocks(children)

		//

		const discriminatedEmbedHandlers = useDiscriminatedData<EmbedHandler>(embedHandlers)
		const embedReferenceDiscriminant = useMemo<FieldValue | undefined>(() => {
			if (embedReferenceDiscriminateBy !== undefined) {
				return VariableInputTransformer.transformValue(embedReferenceDiscriminateBy, environment)
			}
			return undefined
		}, [embedReferenceDiscriminateBy, environment])
		const embedSubBlocks = useNormalizedBlocks(
			embedReferenceDiscriminant !== undefined
				? getDiscriminatedBlock(editorReferenceBlocks, embedReferenceDiscriminant)?.datum.children
				: undefined, // TODO this may crash
		)

		const [baseEditor] = useState(() => createEditorWithEssentials(paragraphElementType))
		const { nodes, onChange, sortedBlocksRef, refreshBlocks } = useBlockEditorState({
			editor: baseEditor,
			blockList: blockListProps,
			contentField,
			sortableBy,
			monolithicReferencesMode,
			referencesField,
		})
		const getReferencedEntity = useGetReferencedEntity({
			monolithicReferencesMode,
			referencesField,
			sortedBlocksRef,
		})
		const createElementReference = useCreateElementReference({
			sortedBlocksRef,
			monolithicReferencesMode,
			referenceDiscriminationField,
			referencesField,
			refreshBlocks,
		})
		const stableCreateElementReference = useReferentiallyStableCallback(createElementReference)

		const insertElementWithReference = useInsertElementWithReference({
			editor: baseEditor,
			createElementReference: stableCreateElementReference,
		})

		const stableGetReferencedEntity = useReferentiallyStableCallback(getReferencedEntity)
		const [editor] = useState(() =>
			initBlockEditor({
				editor: baseEditor,
				augmentEditor,
				augmentEditorBuiltins,
				editorReferenceBlocks,
				embedContentDiscriminationField: desugaredEmbedContentDiscriminationField,
				embedHandlers: discriminatedEmbedHandlers,
				embedReferenceDiscriminateBy: embedReferenceDiscriminant,
				embedSubBlocks,
				plugins,
				referenceDiscriminationField: desugaredReferenceDiscriminationField,
				createElementReferences: stableCreateElementReference,
				getReferencedEntity: stableGetReferencedEntity,
				insertElementWithReference,
			}))


		const shouldDisplayInlineToolbar = useCallback(() => {
			const selection = baseEditor.selection
			return !(!selection || SlateRange.isCollapsed(selection))
		}, [baseEditor])


		const leadingElements = useFieldBackedElementFields(leadingFieldBackedElements)
		const trailingElements = useFieldBackedElementFields(trailingFieldBackedElements)

		const [_, setMeaninglessState] = useState(0)
		useLayoutEffect(() => {
			if (editor.children !== nodes && JSON.stringify(editor.children) !== JSON.stringify(nodes)) {
				editor.children = nodes
				// Force a re-render
				setMeaninglessState(meaninglessState => meaninglessState + 1)
			}
		}, [nodes, editor])


		return (
			<FieldContainer label={label} useLabelElement={false}>
				<ReferencesProvider getReferencedEntity={getReferencedEntity}>
					<SortedBlocksContext.Provider value={sortedBlocksRef.current}>
						<SortableRepeaterContainer
							axis="y"
							lockAxis="y"
							helperClass="is-dragged"
							lockToContainerEdges={true}
							useWindowAsScrollContainer={true}
							useDragHandle={true}
							onSortEnd={useCallback((data: SortEnd) => {
								Transforms.moveNodes(editor, {
									at: [data.oldIndex],
									to: [data.newIndex],
								})
							}, [editor])}
							shouldCancelStart={shouldCancelStart}
						>
							<Slate editor={editor} value={nodes} onChange={onChange}>
								<EditorCanvas
									inset="hovering-toolbar"
									underlyingComponent={EditableCanvas}
									componentProps={{
										renderElement: baseEditor.renderElement,
										renderLeaf: baseEditor.renderLeaf,
										onKeyDown: baseEditor.onKeyDown,
										onFocusCapture: baseEditor.onFocus,
										onBlurCapture: baseEditor.onBlur,
										onDOMBeforeInput: baseEditor.onDOMBeforeInput,
										onDrop: (e => {
											e.preventDefault()
										}),
										placeholder: placeholder,
										leading: leadingElements,
										trailing: trailingElements,
									}}
									size={size ?? 'large'}

								>
									{useMemo(
										() => (
											<HoveringToolbars
												toolbarScheme={toolbarScheme}
												shouldDisplayInlineToolbar={shouldDisplayInlineToolbar}
												inlineButtons={inlineButtons}
												showLabels={showToolbarLabels}
												blockButtons={
													<BlockHoveringToolbarContents
														editorReferenceBlocks={editorReferenceBlocks}
														blockButtons={blockButtons}
														otherBlockButtons={otherBlockButtons}
														showLabels={showToolbarLabels}
													/>
												}
											/>
										),
										[blockButtons, editorReferenceBlocks, inlineButtons, otherBlockButtons, shouldDisplayInlineToolbar, showToolbarLabels, toolbarScheme],
									)}
								</EditorCanvas>
							</Slate>
						</SortableRepeaterContainer>
					</SortedBlocksContext.Provider>
				</ReferencesProvider>
			</FieldContainer>
		)
	},
	(props, environment) => {
		assertStaticBlockEditorInvariants(props, environment)

		const embedHandlers = Array.from(props.embedHandlers || [])

		const inlineButtons: ToolbarButtonSpec[] = props.inlineButtons
			? (
				(Array.isArray(props.inlineButtons[0]) ? props.inlineButtons : [props.inlineButtons]) as ToolbarButtonSpec[][]
			).flat()
			: emptyArray

		const references = !!(props.referencesField && props.referenceDiscriminationField) && (
			<HasMany
				{...(typeof props.referencesField === 'string' ? { field: props.referencesField } : props.referencesField)}
				initialEntityCount={0}
			>
				{inlineButtons
					.filter((button): button is InitializeReferenceToolbarButton => 'referenceContent' in button)
					.map(({ referenceContent: Content }, i) => {
						return (
							<Content key={i} referenceId="" editor={0 as any} selection={null} onSuccess={noop} onCancel={noop} />
						)
					})}
				<SugaredField field={props.referenceDiscriminationField} />
				{props.children}
				{props.embedContentDiscriminationField && (
					<>
						<SugaredField field={props.embedContentDiscriminationField} />
						{embedHandlers.map((handler, i) => (
							<Fragment key={i}>{handler.staticRender(environment)}</Fragment>
						))}
					</>
				)}
			</HasMany>
		)

		return (
			<>
				{props.leadingFieldBackedElements?.map((item, i) => (
					'element' in item ? <Fragment key={`leading_${i}`}>{item.element}</Fragment> : <SugaredField field={item.field} key={`leading_${i}`} />
				))}
				{props.trailingFieldBackedElements?.map((item, i) => (
					'element' in item ? <Fragment key={`trailing_${i}`}>{item.element}</Fragment> : <SugaredField field={item.field} key={`trailing_${i}`} />
				))}
				<Repeater {...props} label={props.label ?? ''} initialEntityCount={0}>
					<SugaredField field={props.sortableBy} />
					<SugaredField field={props.contentField} />
					{!props.monolithicReferencesMode && references}
				</Repeater>
				{props.monolithicReferencesMode && references}
			</>
		)
	},
	'BlockEditor',
)

/**
 * The `BlockEditor` component is the main component of the editor. It is responsible for rendering the content editor.
 *
 * @group Blocks and repeaters
 */
export const BlockEditor = Object.assign<
	typeof BlockEditorComponent,
	{
		ContentOutlet: (props: ContentOutletProps) => ReactElement | null
		// TextField: (props: TextFieldProps) => ReactElement | null
	}
>(BlockEditorComponent, {
	ContentOutlet,
})

const useFieldBackedElementFields = (elements: FieldBackedElement[]) => {
	return <>
		{elements.map((el, i) => {
			if ('element' in el) {
				return <Fragment key={i}>{el.element}</Fragment>
			}
			if (el.format === 'plainText') {
				return (
					<TextareaField
						key={i}
						distinction={'seamless'}
						field={el.field}
						label={undefined}
						placeholder={el.placeholder}
						size={el.size}
					/>
				)
			}
			return <RichTextField key={i} field={el.field} label={undefined} placeholder={el.placeholder} distinction={el.distinction ?? 'seamless'} />
		})}
	</>
}

const assertStaticBlockEditorInvariants = (props: BlockEditorProps, environment: Environment) => {
	if (import.meta.env.DEV) {
		//referencesField?: SugaredRelativeEntityList | string
		//referenceDiscriminationField?: SugaredFieldProps['field']
		//
		//embedReferenceDiscriminateBy?: SugaredDiscriminateBy
		//embedContentDiscriminationField?: SugaredFieldProps['field']
		//embedHandlers?: Iterable<EmbedHandler>

		if (props.referencesField !== undefined && props.referenceDiscriminationField === undefined) {
			throw new BindingError(
				`BlockEditor: missing the 'referenceDiscriminationField' prop. ` +
				`Without it the editor cannot tell different kinds of references apart!`,
			)
		}
		if (props.referencesField === undefined && props.referenceDiscriminationField !== undefined) {
			throw new BindingError(
				`BlockEditor: supplied the 'referenceDiscriminationField' prop but missing 'referencesField'. ` +
				`Either remove 'referenceDiscriminationField' to get rid of this error ` +
				`or provide 'referencesField' to enable content references.`,
			)
		}
		if (
			props.referencesField !== undefined &&
			(props.embedReferenceDiscriminateBy === undefined ||
				props.embedContentDiscriminationField === undefined ||
				props.embedHandlers === undefined) &&
			(props.embedReferenceDiscriminateBy !== undefined ||
				props.embedContentDiscriminationField !== undefined ||
				props.embedHandlers !== undefined)
		) {
			throw new BindingError(
				`BlockEditor: trying to enable embeds without content references being enabled. In order to use embeds, ` +
				`provide both the 'referenceDiscriminationField' as well as the 'referencesField' prop`,
			)
		}

		if (props.embedReferenceDiscriminateBy !== undefined) {
			if (props.embedContentDiscriminationField === undefined) {
				throw new BindingError(
					`BlockEditor: You enabled embed blocks by supplying the 'embedReferenceDiscriminateBy' prop but then ` +
					`failed to also supply the 'embedContentDiscriminationField'. Without it, the editor would not be ` +
					`able to distinguish between the kinds of embedded content.`,
				)
			}
			if (!props.embedHandlers || Array.from(props.embedHandlers).length === 0) {
				throw new BindingError(
					`BlockEditor: You enabled embed blocks by supplying the 'embedReferenceDiscriminateBy' prop but then ` +
					`failed to also supply any embed handlers. Without them, the editor would not be able to ` +
					`recognize any embedded content.`,
				)
			}
		}
	}
}

const RB = RichEditor.buttons
const defaultInlineButtons: HoveringToolbarsProps['inlineButtons'] = [
	[RB.bold, RB.italic, RB.underline, RB.anchor],
	[RB.headingOne, RB.headingTwo],
	[RB.strikeThrough, RB.code],
]
