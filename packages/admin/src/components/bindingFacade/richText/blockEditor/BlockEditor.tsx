import {
	BindingError,
	Component,
	EntityAccessor,
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
	useEnvironment,
	useMutationState,
	useParentEntityAccessor,
	useRelativeEntityList,
	useRelativeSingleField,
	useSortedEntities,
	VariableInputTransformer,
} from '@contember/binding'
import { emptyArray, useConstantLengthInvariant } from '@contember/react-utils'
import { EditorCanvas } from '@contember/ui'
import * as React from 'react'
import { PathRef } from 'slate'
import { Editable, Slate } from 'slate-react'
import { getDiscriminatedBlock, useNormalizedBlocks } from '../../blocks'
import { Repeater } from '../../collections'
import { SugaredDiscriminateBy, useDiscriminatedData } from '../../discrimination'
import { ElementNode } from '../baseEditor'
import { CreateEditorPublicOptions } from '../editorFactory'
import { RichEditor } from '../RichEditor'
import { HoveringToolbars, HoveringToolbarsProps } from '../toolbars'
import { BlockHoveringToolbarContents, BlockHoveringToolbarContentsProps } from './BlockHoveringToolbarContents'
import { createBlockEditor } from './editor'
import { ContemberFieldElement } from './elements'
import { EmbedHandler } from './embed'
import { FieldBackedElement } from './FieldBackedElement'
import { useBlockEditorSlateNodes } from './useBlockEditorSlateNodes'

export interface BlockEditorProps extends SugaredRelativeEntityList, CreateEditorPublicOptions {
	label: React.ReactNode
	contentField: SugaredFieldProps['field']
	sortableBy: SugaredFieldProps['field']
	children?: React.ReactNode

	leadingFieldBackedElements?: FieldBackedElement[]
	trailingFieldBackedElements?: FieldBackedElement[]

	referencesField?: SugaredRelativeEntityList | string
	referenceDiscriminationField?: SugaredFieldProps['field']

	embedReferenceDiscriminateBy?: SugaredDiscriminateBy
	embedContentDiscriminationField?: SugaredFieldProps['field']
	embedHandlers?: Iterable<EmbedHandler>

	// TODO
	inlineButtons?: HoveringToolbarsProps['inlineButtons']
	blockButtons?: BlockHoveringToolbarContentsProps['blockButtons']
	otherBlockButtons?: BlockHoveringToolbarContentsProps['otherBlockButtons']
}

// TODO enforce that leadingFieldBackedElements and trailingFieldBackedElements always have the same length
export const BlockEditor = Component<BlockEditorProps>(
	props => {
		const environment = useEnvironment()
		const isMutating = useMutationState()
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

			...blockListProps
		} = props

		const parentEntity = useParentEntityAccessor() // TODO this is over-subscribing
		const referenceList = useRelativeEntityList(referencesField) // TODO this is over-subscribing

		const batchUpdates = parentEntity.batchUpdates
		const blockList = useRelativeEntityList(blockListProps)

		const desugaredBlockList = useDesugaredRelativeEntityList(blockListProps)
		const desugaredBlockContentField = useDesugaredRelativeSingleField(contentField)
		const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)

		// const desugaredReferenceList = useDesugaredRelativeEntityList(referencesField)
		const desugaredReferenceDiscriminationField = useDesugaredRelativeSingleField(referenceDiscriminationField)
		const desugaredEmbedContentDiscriminationField = useDesugaredRelativeSingleField(embedContentDiscriminationField)

		//

		const leadingAccessors = useFieldBackedElements(parentEntity, leadingFieldBackedElements)
		const trailingAccessors = useFieldBackedElements(parentEntity, trailingFieldBackedElements)

		const normalizedReferenceBlocks = useNormalizedBlocks(children)
		const { entities: topLevelBlocks } = useSortedEntities(blockList, sortableBy)

		//

		const discriminatedEmbedHandlers = useDiscriminatedData<EmbedHandler>(embedHandlers)
		const embedReferenceDiscriminant = React.useMemo<FieldValue | undefined>(() => {
			if (embedReferenceDiscriminateBy !== undefined) {
				return VariableInputTransformer.transformVariableLiteral(embedReferenceDiscriminateBy, environment)
			}
			return undefined
		}, [embedReferenceDiscriminateBy, environment])
		const embedSubBlocks = useNormalizedBlocks(
			embedReferenceDiscriminant !== undefined
				? getDiscriminatedBlock(normalizedReferenceBlocks, embedReferenceDiscriminant)?.datum.children
				: undefined, // TODO this may crash
		)

		//

		const [contemberFieldElementCache] = React.useState(
			() => new WeakMap<FieldAccessor<string>, ContemberFieldElement>(),
		)
		const [blockElementCache] = React.useState(() => new WeakMap<EntityAccessor, ElementNode>())
		const [blockElementPathRefs] = React.useState(() => new Map<string, PathRef>())

		//

		const batchUpdatesRef = React.useRef(batchUpdates)
		const blockListRef = React.useRef(blockList)
		const isMutatingRef = React.useRef(isMutating)
		const sortedBlocksRef = React.useRef(topLevelBlocks)
		const normalizedReferenceBlocksRef = React.useRef(normalizedReferenceBlocks)

		React.useLayoutEffect(() => {
			batchUpdatesRef.current = batchUpdates
			blockListRef.current = blockList
			isMutatingRef.current = isMutating
			sortedBlocksRef.current = topLevelBlocks
			normalizedReferenceBlocksRef.current = normalizedReferenceBlocks
		}) // Deliberately no deps array

		const [editor] = React.useState(() =>
			createBlockEditor({
				augmentEditor,
				augmentEditorBuiltins,
				batchUpdatesRef,
				bindingOperations,
				blockContentField: desugaredBlockContentField,
				blockElementCache,
				blockElementPathRefs,
				contemberFieldElementCache,
				createNewReference: referenceList?.createNewEntity,
				desugaredBlockList,
				embedContentDiscriminationField: desugaredEmbedContentDiscriminationField,
				embedHandlers: discriminatedEmbedHandlers,
				embedReferenceDiscriminateBy: embedReferenceDiscriminant,
				embedSubBlocks,
				isMutatingRef,
				leadingFields: leadingFieldBackedElements,
				trailingFields: trailingFieldBackedElements,
				normalizedReferenceBlocksRef,
				placeholder: label,
				plugins,
				referenceDiscriminationField: desugaredReferenceDiscriminationField,
				sortableByField: desugaredSortableByField,
				sortedBlocksRef,
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
					{React.useMemo(
						() => (
							<HoveringToolbars
								inlineButtons={inlineButtons}
								blockButtons={
									<BlockHoveringToolbarContents blockButtons={blockButtons} otherBlockButtons={otherBlockButtons} />
								}
							/>
						),
						[blockButtons, inlineButtons, otherBlockButtons],
					)}
				</EditorCanvas>
			</Slate>
		)
	},
	(props, environment) => {
		assertStaticBlockEditorInvariants(props, environment)

		const embedHandlers = Array.from(props.embedHandlers || [])

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
				</Repeater>
				{!!(props.referencesField && props.referenceDiscriminationField) && (
					<HasMany
						{...(typeof props.referencesField === 'string' ? { field: props.referencesField } : props.referencesField)}
						initialEntityCount={0}
					>
						<SugaredField field={props.referenceDiscriminationField} />
						{props.children}
						{props.embedContentDiscriminationField && (
							<>
								<SugaredField field={props.embedContentDiscriminationField} />
								{embedHandlers.map((handler, i) => (
									<React.Fragment key={i}>{handler.getStaticFields(environment)}</React.Fragment>
								))}
							</>
						)}
					</HasMany>
				)}
			</>
		)
	},
	'BlockEditor',
)

const useFieldBackedElements = (entity: EntityAccessor, original: FieldBackedElement[]): FieldAccessor<string>[] => {
	useConstantLengthInvariant(
		original,
		'The number of leading/trailing field-backed elements must remain constant between renders.',
	)
	const unstableAccessorArray = original.map(fieldBackedElement => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useRelativeSingleField<string>(fieldBackedElement.field)
	})

	// eslint-disable-next-line react-hooks/exhaustive-deps
	return React.useMemo(() => unstableAccessorArray, unstableAccessorArray)
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
