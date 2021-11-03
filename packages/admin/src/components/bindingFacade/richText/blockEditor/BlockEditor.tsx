import {
	BindingError,
	Component,
	EntityAccessor,
	EntityId,
	EntityRealmKey,
	Environment,
	FieldValue,
	HasMany,
	SugaredField,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useBindingOperations,
	useDesugaredRelativeEntityList,
	useDesugaredRelativeSingleField,
	useEntity,
	useEntityBeforeUpdate,
	useEntityList,
	useEntityPersistSuccess,
	useEnvironment,
	useSortedEntities,
	VariableInputTransformer,
} from '@contember/binding'
import { emptyArray, noop } from '@contember/react-utils'
import { EditorCanvas, EditorCanvasSize } from '@contember/ui'
import {
	Fragment,
	FunctionComponent,
	ReactElement,
	ReactNode,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { Editor, Element as SlateElement, PathRef, Range as SlateRange } from 'slate'
import { Slate } from 'slate-react'
import { getDiscriminatedBlock, useNormalizedBlocks } from '../../blocks'
import { Repeater } from '../../collections'
import { SugaredDiscriminateBy, useDiscriminatedData } from '../../discrimination'
import type { CreateEditorPublicOptions } from '../editorFactory'
import { RichEditor } from '../RichEditor'
import {
	HoveringToolbars,
	HoveringToolbarsProps,
	InitializeReferenceToolbarButton,
	ToolbarButtonSpec,
} from '../toolbars'
import { BlockHoveringToolbarContents, BlockHoveringToolbarContentsProps } from './BlockHoveringToolbarContents'
import { createBlockEditor } from './editor'
import type { EmbedHandler } from './embed'
import type { FieldBackedElement } from './FieldBackedElement'
import { ContentOutlet, ContentOutletProps, useEditorReferenceBlocks } from './templating'
import { useBlockEditorSlateNodes } from './useBlockEditorSlateNodes'
import { EditableCanvas } from '../baseEditor/EditableCanvas'
import { TextField } from '../../fields'
import { RichTextField } from '../RichTextField'

export interface BlockEditorProps extends SugaredRelativeEntityList, CreateEditorPublicOptions {
	label: string
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

	// TODO
	inlineButtons?: HoveringToolbarsProps['inlineButtons']
	blockButtons?: BlockHoveringToolbarContentsProps['blockButtons']
	otherBlockButtons?: BlockHoveringToolbarContentsProps['otherBlockButtons']
}

const BlockEditorComponent: FunctionComponent<BlockEditorProps> = Component(
	props => {
		const environment = useEnvironment()
		//const isMutating = useMutationState()
		const isMutating = false // TODO see the pathRef flushing below
		const bindingOperations = useBindingOperations()

		assertStaticBlockEditorInvariants(props, environment)

		const {
			label,
			contentField,
			sortableBy,
			children,
			size,

			leadingFieldBackedElements = emptyArray,
			trailingFieldBackedElements = emptyArray,

			referencesField,
			referenceDiscriminationField,

			embedReferenceDiscriminateBy,
			embedContentDiscriminationField,
			embedHandlers = emptyArray,

			inlineButtons = defaultInlineButtons,
			blockButtons,
			otherBlockButtons,

			plugins,
			augmentEditor,
			augmentEditorBuiltins,

			...blockListProps
		} = props

		const parentEntity = useEntity() // TODO this is over-subscribing
		const blockList = useEntityList(blockListProps)

		// eslint-disable-next-line react-hooks/rules-of-hooks
		const referenceList = props.monolithicReferencesMode ? useEntityList(referencesField) : undefined

		const getParentEntity = parentEntity.getAccessor

		const desugaredBlockList = useDesugaredRelativeEntityList(blockListProps)
		const desugaredBlockContentField = useDesugaredRelativeSingleField(contentField)
		const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)

		// const desugaredReferenceList = useDesugaredRelativeEntityList(referencesField)
		const desugaredReferenceDiscriminationField = useDesugaredRelativeSingleField(referenceDiscriminationField)
		const desugaredEmbedContentDiscriminationField = useDesugaredRelativeSingleField(embedContentDiscriminationField)


		const editorReferenceBlocks = useEditorReferenceBlocks(children)
		const { entities: topLevelBlocks } = useSortedEntities(blockList, sortableBy)

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

		//
		const [blockElementCache] = useState(() => new WeakMap<EntityAccessor, SlateElement>())
		const [blockElementPathRefs] = useState(() => new Map<string, PathRef>())
		const [referencedEntityCache] = useState(() => new Map<EntityId, EntityRealmKey>())

		//

		const getParentEntityRef = useRef(getParentEntity)
		const isMutatingRef = useRef(isMutating)
		const sortedBlocksRef = useRef(topLevelBlocks)

		useLayoutEffect(() => {
			getParentEntityRef.current = getParentEntity
			isMutatingRef.current = isMutating
			sortedBlocksRef.current = topLevelBlocks
		}) // Deliberately no deps array

		const [editor] = useState(() =>
			createBlockEditor({
				augmentEditor,
				augmentEditorBuiltins,
				bindingOperations,
				blockContentField: desugaredBlockContentField,
				blockElementCache,
				blockElementPathRefs,
				createMonolithicReference: referenceList
					? initialize => referenceList.getAccessor().createNewEntity(initialize)
					: undefined,
				desugaredBlockList,
				editorReferenceBlocks,
				embedContentDiscriminationField: desugaredEmbedContentDiscriminationField,
				embedHandlers: discriminatedEmbedHandlers,
				embedReferenceDiscriminateBy: embedReferenceDiscriminant,
				embedSubBlocks,
				getMonolithicReferenceById: referenceList
					? id => referenceList.getAccessor().getChildEntityById(id)
					: undefined,
				getParentEntityRef,
				isMutatingRef,
				plugins,
				referencedEntityCache,
				referenceDiscriminationField: desugaredReferenceDiscriminationField,
				referencesField,
				sortableByField: desugaredSortableByField,
				sortedBlocksRef,
			}),
		)

		// TODO this isn't particularly great. We should probably react to id changes more directly.
		useEntityPersistSuccess(
			useCallback(
				getEntity => {
					referencedEntityCache.clear()

					for (const ref of blockElementPathRefs.values()) {
						ref.unref()
					}
					blockElementPathRefs.clear()
					const blocks = getEntity().getEntityList(blockListProps)
					let blockIndex = 0
					for (const topLevelBlock of blocks) {
						blockElementPathRefs.set(topLevelBlock.id, Editor.pathRef(editor, [blockIndex++], { affinity: 'backward' }))
					}
				},
				[referencedEntityCache, blockElementPathRefs, blockListProps, editor],
			),
		)

		const nodes = useBlockEditorSlateNodes({
			editor,
			blockElementCache,
			blockElementPathRefs,
			blockContentField: desugaredBlockContentField,
			topLevelBlocks,
		})

		useEntityBeforeUpdate(
			useCallback(
				getAccessor => {
					const hasPendingOperations = !!editor.operations.length // See the explanation in overrideSlateOnChange

					// This could feasibly be over-eager and cause incorrect early returns (due to both sides of the or)
					// but I cannot force the editor into a situation where this would actually be the case.
					if (props.monolithicReferencesMode || hasPendingOperations) {
						return
					}
					for (const blockEntity of getAccessor().getEntityList(blockListProps)) {
						const cachedElement = blockElementCache.get(blockEntity)

						if (cachedElement !== undefined) {
							continue
						}
						const blockIndex =
							blockEntity.getRelativeSingleField<number>(desugaredSortableByField).value!
						if (editor.children.length < blockIndex) {
							continue
						}

						// Whenever something changes within the block, we get a new instance of the blockEntity accessor.
						// Not all such changes are due to the editor though. Some could be just something within the reference.
						// In those cases, we would get a cache miss and deserialize the block node again, thereby losing its
						// referential equality. That, in turn, would cause Slate to re-mount the element during render which
						// would completely ruin the UX. Thus we want to keep the old node if possible. We check whether it
						// would be equivalent, and if so, just use the old one. That way Slate never gets a new node and no
						// remounting ever takes place.
						const previousNode = editor.children[blockIndex]
						const contentField = blockEntity.getRelativeSingleField<string>(desugaredBlockContentField)
						const currentNode = editor.deserializeNodes(
							contentField.value!,
							`BlockEditor: The 'contentField' of a block contains invalid data.`,
						)[0]
						if (SlateElement.isElement(previousNode) && JSON.stringify(previousNode) === JSON.stringify(currentNode)) {
							blockElementCache.set(blockEntity, previousNode)
						}
					}
				},
				[blockElementCache, blockListProps, desugaredBlockContentField, desugaredSortableByField, editor, props.monolithicReferencesMode],
			),
		)

		const shouldDisplayInlineToolbar = useCallback(() => {
			const selection = editor.selection
			return !(!selection || SlateRange.isCollapsed(selection))
		}, [editor])


		const leadingElements = useFieldBackedElementFields(leadingFieldBackedElements)
		const trailingElements = useFieldBackedElementFields(trailingFieldBackedElements)

		// TODO label?
		return (
			<Slate editor={editor} value={nodes} onChange={editor.slateOnChange}>
				<EditorCanvas
					underlyingComponent={EditableCanvas}
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
						placeholder: label,
						leading: leadingElements,
						trailing: trailingElements,
					}}
					size={size ?? 'large'}
				>
					{useMemo(
						() => (
							<HoveringToolbars
								shouldDisplayInlineToolbar={shouldDisplayInlineToolbar}
								inlineButtons={inlineButtons}
								blockButtons={
									<BlockHoveringToolbarContents
										editorReferenceBlocks={editorReferenceBlocks}
										blockButtons={blockButtons}
										otherBlockButtons={otherBlockButtons}
									/>
								}
							/>
						),
						[blockButtons, editorReferenceBlocks, inlineButtons, otherBlockButtons, shouldDisplayInlineToolbar],
					)}
				</EditorCanvas>
			</Slate>
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
					<SugaredField field={item.field} key={`leading_${i}`} />
				))}
				{props.trailingFieldBackedElements?.map((item, i) => (
					<SugaredField field={item.field} key={`trailing_${i}`} />
				))}
				<Repeater {...props} initialEntityCount={0}>
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
		{elements.map(el => {
			if (el.format === 'plainText') {
				return (
					<TextField field={el.field} label={undefined} placeholder={el.placeholder} distinction={'seamless'}
										 size={el.size} />
				)
			}
			return <RichTextField field={el.field} label={undefined} placeholder={el.placeholder} distinction={'seamless'} />
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
