import {
	BindingError,
	Component,
	EntityAccessor,
	EntityId,
	EntityListSubTree,
	EntityRealmKey,
	Environment,
	FieldAccessor,
	FieldValue,
	HasMany,
	SugaredField,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useBindingOperations,
	useDesugaredRelativeEntityList,
	useDesugaredRelativeSingleField,
	useEntity,
	useEntityBeforePersist,
	useEntityBeforeUpdate,
	useEntityList,
	useEntityPersistSuccess,
	useEnvironment,
	useField,
	useSortedEntities,
	VariableInputTransformer,
} from '@contember/binding'
import { emptyArray, noop, useConstantLengthInvariant } from '@contember/react-utils'
import { EditorCanvas } from '@contember/ui'
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
import { Editor, PathRef, Range as SlateRange } from 'slate'
import { Editable, Slate } from 'slate-react'
import { getDiscriminatedBlock, useNormalizedBlocks } from '../../blocks'
import { Repeater } from '../../collections'
import { SugaredDiscriminateBy, useDiscriminatedData } from '../../discrimination'
import type { ElementNode } from '../baseEditor'
import type { CreateEditorPublicOptions } from '../editorFactory'
import { RichEditor } from '../RichEditor'
import {
	HoveringToolbars,
	HoveringToolbarsProps,
	InitializeReferenceToolbarButton,
	ToolbarButtonSpec,
} from '../toolbars'
import { BlockHoveringToolbarContents, BlockHoveringToolbarContentsProps } from './BlockHoveringToolbarContents'
import { createBlockEditor, Unstable_BlockEditorDiagnostics } from './editor'
import type { ContemberFieldElement } from './elements'
import type { EmbedHandler } from './embed'
import type { FieldBackedElement } from './FieldBackedElement'
import { ContentOutlet, ContentOutletProps, useEditorReferenceBlocks } from './templating'
import { useBlockEditorSlateNodes } from './useBlockEditorSlateNodes'

export interface BlockEditorProps extends SugaredRelativeEntityList, CreateEditorPublicOptions {
	label: ReactNode
	contentField: SugaredFieldProps['field']
	sortableBy: SugaredFieldProps['field']
	children?: ReactNode

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

	unstable_diagnosticLog?: Unstable_BlockEditorDiagnostics
}

// TODO enforce that leadingFieldBackedElements and trailingFieldBackedElements always have the same length
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

			unstable_diagnosticLog,

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

		//

		const leadingAccessors = useFieldBackedElements(parentEntity, leadingFieldBackedElements)
		const trailingAccessors = useFieldBackedElements(parentEntity, trailingFieldBackedElements)

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

		const [contemberFieldElementCache] = useState(() => new WeakMap<FieldAccessor<string>, ContemberFieldElement>())
		const [blockElementCache] = useState(() => new WeakMap<EntityAccessor, ElementNode>())
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

		// TODO this isn't particularly great. We should probably react to id changes more directly.
		useEntityPersistSuccess(
			useCallback(() => {
				for (const [, ref] of blockElementPathRefs) {
					ref.unref()
				}
				blockElementPathRefs.clear()
				referencedEntityCache.clear()
			}, [blockElementPathRefs, referencedEntityCache]),
		)

		const [editor] = useState(() =>
			createBlockEditor({
				augmentEditor,
				augmentEditorBuiltins,
				bindingOperations,
				blockContentField: desugaredBlockContentField,
				blockElementCache,
				blockElementPathRefs,
				contemberFieldElementCache,
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
				leadingFields: leadingFieldBackedElements,
				trailingFields: trailingFieldBackedElements,
				placeholder: label,
				plugins,
				referencedEntityCache,
				referenceDiscriminationField: desugaredReferenceDiscriminationField,
				referencesField,
				sortableByField: desugaredSortableByField,
				sortedBlocksRef,

				unstable_diagnosticLog,
			}),
		)

		const nodes = useBlockEditorSlateNodes({
			placeholder: label,
			editor,
			blockElementCache,
			blockElementPathRefs,
			blockContentField: desugaredBlockContentField,
			contemberFieldElementCache,
			topLevelBlocks,
			leadingFieldBackedElements,
			trailingFieldBackedElements,
			leadingFieldBackedAccessors: leadingAccessors,
			trailingFieldBackedAccessors: trailingAccessors,
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
							blockEntity.getRelativeSingleField<number>(desugaredSortableByField).value! +
							leadingFieldBackedElements.length
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
						)[0] as ElementNode
						if (JSON.stringify(previousNode) === JSON.stringify(currentNode)) {
							blockElementCache.set(blockEntity, previousNode as ElementNode)
						}
					}
				},
				[
					blockElementCache,
					blockListProps,
					desugaredBlockContentField,
					desugaredSortableByField,
					editor,
					leadingFieldBackedElements.length,
					props.monolithicReferencesMode,
				],
			),
		)

		if (unstable_diagnosticLog) {
			useEntityBeforePersist(
				useCallback(
					(getParentAccessor, options) => {
						if (!editor.unstable_diagnosticOperationLog.length) {
							return
						}

						const subTree = options.getEntityListSubTree({
							entities: unstable_diagnosticLog.entities,
							isCreating: true,
						})
						subTree.createNewEntity((getNewLogEntity, options) => {
							getNewLogEntity()
								.getField<string>(unstable_diagnosticLog.persistedAtField)
								.updateValue(new Date().toISOString())
							getNewLogEntity()
								.getField<string>(unstable_diagnosticLog.operationsField)
								.updateValue(JSON.stringify(editor.unstable_diagnosticOperationLog))
							unstable_diagnosticLog.identify(getParentAccessor, getNewLogEntity, options)
						})
					},
					[editor.unstable_diagnosticOperationLog, unstable_diagnosticLog],
				),
			)
			useEntityPersistSuccess(
				useCallback(() => {
					editor.unstable_diagnosticOperationLog.length = 0
				}, [editor.unstable_diagnosticOperationLog]),
			)
		}

		// TODO this is a bit of a hack.
		const shouldDisplayInlineToolbar = useCallback(() => {
			const selection = editor.selection

			if (!selection || SlateRange.isCollapsed(selection)) {
				return false
			}
			if (leadingFieldBackedElements.length === 0) {
				return true
			}

			// TODO This shouldn't be hardcoded like this.
			const rangeOfFieldBacked: SlateRange = {
				anchor: Editor.start(editor, [0]),
				focus: Editor.end(editor, [leadingFieldBackedElements.length - 1]),
			}
			const intersection = SlateRange.intersection(selection, rangeOfFieldBacked)

			// This is a bit of set theory. If A is a subset of B if and only if their intersection is equal to A.
			// We don't want to disable the toolbar if some part of the selection is outside of rangeOfFieldBacked,
			// and so we disable the toolbar only if the entirety of the selection is contained within rangeOfFieldBacked.
			return intersection === null || !SlateRange.equals(selection, intersection)
		}, [editor, leadingFieldBackedElements.length])

		// TODO label?
		return (
			<Slate editor={editor} value={nodes} onChange={editor.slateOnChange}>
				<EditorCanvas
					underlyingComponent={Editable}
					componentProps={{
						renderElement: editor.renderElement,
						renderLeaf: editor.renderLeaf,
						onKeyDown: editor.onKeyDown,
						onFocusCapture: editor.onFocus,
						onBlurCapture: editor.onBlur,
						onDOMBeforeInput: editor.onDOMBeforeInput,
					}}
					size="large"
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
			? ((Array.isArray(props.inlineButtons[0])
					? props.inlineButtons
					: [props.inlineButtons]) as ToolbarButtonSpec[][]).flat()
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
				{props.unstable_diagnosticLog && (
					<EntityListSubTree entities={props.unstable_diagnosticLog.entities} isCreating>
						<SugaredField field={props.unstable_diagnosticLog.operationsField} />
						<SugaredField field={props.unstable_diagnosticLog.persistedAtField} />
						{props.unstable_diagnosticLog.identificationStaticRender}
					</EntityListSubTree>
				)}
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

const useFieldBackedElements = (entity: EntityAccessor, original: FieldBackedElement[]): FieldAccessor<string>[] => {
	useConstantLengthInvariant(
		original,
		'The number of leading/trailing field-backed elements must remain constant between renders.',
	)
	const unstableAccessorArray = original.map(fieldBackedElement => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useField<string>(fieldBackedElement.field)
	})

	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo(() => unstableAccessorArray, unstableAccessorArray)
}

const assertStaticBlockEditorInvariants = (props: BlockEditorProps, environment: Environment) => {
	if (__DEV_MODE__) {
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
