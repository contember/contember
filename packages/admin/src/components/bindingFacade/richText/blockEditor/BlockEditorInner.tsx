import {
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	Environment,
	FieldAccessor,
	RelativeEntityList,
	RemovalType,
	SugaredRelativeSingleField,
	useDesugaredRelativeSingleField,
	useMutationState,
	useSortedEntities,
	VariableInputTransformer,
} from '@contember/binding'
import { noop } from '@contember/react-utils'
import { EditorCanvas } from '@contember/ui'
import * as React from 'react'
import { Element } from 'slate'
import { Editable, Slate } from 'slate-react'
import { assertNever } from '../../../../utils'
import { LiteralBasedBlockProps, ScalarBasedBlockProps, useNormalizedBlocks } from '../../blocks'
import { CreateEditorPublicOptions } from '../editorFactory'
import { RichEditor } from '../RichEditor'
import { HoveringToolbars, HoveringToolbarsProps } from '../toolbars'
import { BlockHoveringToolbarContents, BlockHoveringToolbarContentsProps } from './BlockHoveringToolbarContents'
import { createBlockEditor } from './editor'
import { NormalizedFieldBackedElement } from './FieldBackedElement'
import { BlockEditorGetEntityByKeyContext, BlockEditorGetNormalizedFieldBackedElementContext } from './renderers'
import { useBlockEditorSlateNodes } from './useBlockEditorSlateNodes'

const RB = RichEditor.buttons
const defaultInlineButtons: HoveringToolbarsProps['inlineButtons'] = [
	[RB.bold, RB.italic, RB.underline, RB.anchor],
	[RB.headingOne, RB.headingTwo],
	[RB.strikeThrough, RB.code],
]
export interface BlockEditorInnerPublicProps extends CreateEditorPublicOptions {
	children: React.ReactNode
	label: React.ReactNode
	removalType?: RemovalType
	sortableBy: SugaredRelativeSingleField['field']

	discriminationField: string | SugaredRelativeSingleField
	textBlockField: string | SugaredRelativeSingleField
	textBlockDiscriminatedBy?: LiteralBasedBlockProps['discriminateBy']
	textBlockDiscriminatedByScalar?: ScalarBasedBlockProps['discriminateByScalar']

	// TODO
	inlineButtons?: HoveringToolbarsProps['inlineButtons']
	blockButtons?: BlockHoveringToolbarContentsProps['blockButtons']
	otherBlockButtons?: BlockHoveringToolbarContentsProps['otherBlockButtons']
}

export interface BlockEditorInnerInternalProps {
	leadingFieldBackedElements: NormalizedFieldBackedElement[]
	//trailingFieldBackedElements: NormalizedFieldBackedElement[]
	batchUpdates: EntityAccessor['batchUpdates']
	desugaredEntityList: RelativeEntityList
	entityListAccessor: EntityListAccessor
	environment: Environment
}

export type BlockEditorInnerProps = BlockEditorInnerPublicProps & BlockEditorInnerInternalProps

export const BlockEditorInner = React.memo(
	({
		batchUpdates,
		desugaredEntityList,
		entityListAccessor,
		environment,
		children,
		discriminationField,
		sortableBy,
		label,
		removalType = 'disconnect',
		textBlockDiscriminatedBy,
		textBlockDiscriminatedByScalar,
		textBlockField,
		inlineButtons = defaultInlineButtons,
		blockButtons,
		otherBlockButtons,
		//trailingFieldBackedElements
		leadingFieldBackedElements,

		plugins,
		augmentEditor,
		augmentEditorBuiltins,
	}: BlockEditorInnerProps) => {
		const renderCountRef = React.useRef(0)

		const isMutating = useMutationState()

		const desugaredDiscriminationField = useDesugaredRelativeSingleField(discriminationField)
		const desugaredTextBlockField = useDesugaredRelativeSingleField(textBlockField)
		const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)

		const { entities, moveEntity, appendNew } = useSortedEntities(entityListAccessor, sortableBy)

		const textBlockDiscriminant = React.useMemo(() => {
			if (textBlockDiscriminatedBy !== undefined) {
				return VariableInputTransformer.transformVariableLiteral(textBlockDiscriminatedBy, environment)
			}
			if (textBlockDiscriminatedByScalar !== undefined) {
				return VariableInputTransformer.transformVariableScalar(textBlockDiscriminatedByScalar, environment)
			}
			throw new BindingError(
				`BlockEditor: undiscriminated text blocks. You must supply either the 'textBlockDiscriminatedBy' or the ` +
					`'textBlockDiscriminatedByScalar' props.`,
			)
		}, [environment, textBlockDiscriminatedBy, textBlockDiscriminatedByScalar])
		const normalizedBlocks = useNormalizedBlocks(children)
		const [contemberFieldElementCache] = React.useState(() => new WeakMap<FieldAccessor, Element>())
		const [textElementCache] = React.useState(() => new WeakMap<EntityAccessor, Element>())
		const [contemberBlockElementCache] = React.useState(() => new Map<string, Element>())

		const batchUpdatesRef = React.useRef(batchUpdates)
		const entityListAccessorRef = React.useRef(entityListAccessor)
		const isMutatingRef = React.useRef(isMutating)
		const sortedEntitiesRef = React.useRef(entities)
		const normalizedBlocksRef = React.useRef(normalizedBlocks)
		const normalizedLeadingFieldsRef = React.useRef(leadingFieldBackedElements)
		//const normalizedTrailingFieldsRef = React.useRef(trailingFieldBackedElements)

		React.useLayoutEffect(() => {
			batchUpdatesRef.current = batchUpdates
			entityListAccessorRef.current = entityListAccessor
			isMutatingRef.current = isMutating
			sortedEntitiesRef.current = entities
			normalizedLeadingFieldsRef.current = leadingFieldBackedElements
			//normalizedTrailingFieldsRef.current = trailingFieldBackedElements

			renderCountRef.current++
		}) // Deliberately no deps array

		const [editor] = React.useState(() =>
			createBlockEditor({
				plugins,
				augmentEditor,
				augmentEditorBuiltins,
				desugaredEntityList,
				entityListAccessorRef,
				fieldElementCache: contemberFieldElementCache,
				batchUpdatesRef,
				isMutatingRef,
				sortedEntitiesRef,
				normalizedBlocksRef,
				normalizedLeadingFieldsRef,
				//normalizedTrailingFieldsRef,
				textBlockDiscriminant,
				discriminationField: desugaredDiscriminationField,
				sortableByField: desugaredSortableByField,
				textBlockField: desugaredTextBlockField,
				textElementCache,
				removalType,
				placeholder: label,
			}),
		)

		const nodes = useBlockEditorSlateNodes({
			placeholder: label,
			editor,
			discriminationField: desugaredDiscriminationField,
			textElementCache,
			contemberFieldElementCache,
			contemberBlockElementCache,
			textBlockField: desugaredTextBlockField,
			blocks: normalizedBlocks,
			textBlockDiscriminant,
			entities,
			leadingFieldBackedElements,
			//trailingFieldBackedElements,
		})

		// TODO label?
		return (
			<BlockEditorGetEntityByKeyContext.Provider
				value={key => {
					const entity = entityListAccessor.getByKey(key)
					if (!(entity instanceof EntityAccessor)) {
						throw new BindingError(`Corrupted data.`)
					}
					return entity
				}}
			>
				<BlockEditorGetNormalizedFieldBackedElementContext.Provider
					value={element => {
						let normalizedElements: NormalizedFieldBackedElement[]
						if (element.position === 'leading') {
							normalizedElements = leadingFieldBackedElements
						} /*else if (element.position === 'trailing') {
							normalizedElements = trailingFieldBackedElements
						} */ else {
							return assertNever(element.position)
						}
						return normalizedElements[element.index]
					}}
				>
					<Slate editor={editor} value={nodes} onChange={noop}>
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
							<HoveringToolbars
								inlineButtons={inlineButtons}
								blockButtons={
									<BlockHoveringToolbarContents blockButtons={blockButtons} otherBlockButtons={otherBlockButtons} />
								}
							/>
						</EditorCanvas>
					</Slate>
				</BlockEditorGetNormalizedFieldBackedElementContext.Provider>
			</BlockEditorGetEntityByKeyContext.Provider>
		)
	},
)
BlockEditorInner.displayName = 'BlockEditorInner'
