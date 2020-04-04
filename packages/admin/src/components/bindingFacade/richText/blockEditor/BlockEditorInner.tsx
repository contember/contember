import {
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	FieldAccessor,
	RelativeEntityList,
	RemovalType,
	SugaredRelativeSingleField,
	useDesugaredRelativeSingleField,
	useEnvironment,
	useMutationState,
	useSortedEntities,
	VariableInputTransformer,
} from '@contember/binding'
import { EditorCanvas } from '@contember/ui'
import * as React from 'react'
import { Element } from 'slate'
import { Editable, Slate } from 'slate-react'
import { LiteralBasedBlockProps, ScalarBasedBlockProps, useNormalizedBlocks } from '../../blocks'
import { createEditor } from './editor'
import { NormalizedFieldBackedElement } from './FieldBackedElement'
import { ContemberElementRefreshContext } from './renderers'
import { HoveringToolbar, HoveringToolbarProps } from './toolbars'
import { useSlateNodes } from './useSlateNodes'

export interface BlockEditorInnerPublicProps {
	children: React.ReactNode
	label: React.ReactNode
	removalType?: RemovalType
	sortableBy: SugaredRelativeSingleField['field']

	discriminationField: string | SugaredRelativeSingleField
	textBlockField: string | SugaredRelativeSingleField
	textBlockDiscriminatedBy?: LiteralBasedBlockProps['discriminateBy']
	textBlockDiscriminatedByScalar?: ScalarBasedBlockProps['discriminateByScalar']
	// TODO configure marks
	// TODO configure elements

	blockButtons?: HoveringToolbarProps['blockButtons']
	otherBlockButtons?: HoveringToolbarProps['otherBlockButtons']
}

export interface BlockEditorInnerInternalProps {
	leadingFieldBackedElements: NormalizedFieldBackedElement[]
	//trailingFieldBackedElements: NormalizedFieldBackedElement[]
	batchUpdates: EntityAccessor['batchUpdates']
	desugaredEntityList: RelativeEntityList
	entityListAccessor: EntityListAccessor
}

export type BlockEditorInnerProps = BlockEditorInnerPublicProps & BlockEditorInnerInternalProps

const noop = () => {}
export const BlockEditorInner = React.memo(
	({
		batchUpdates,
		desugaredEntityList,
		entityListAccessor,
		children,
		discriminationField,
		sortableBy,
		label,
		removalType = 'disconnect',
		textBlockDiscriminatedBy,
		textBlockDiscriminatedByScalar,
		textBlockField,
		blockButtons,
		otherBlockButtons,
		//trailingFieldBackedElements
		leadingFieldBackedElements,
	}: BlockEditorInnerProps) => {
		const renderCountRef = React.useRef(0)

		const isMutating = useMutationState()
		const environment = useEnvironment()

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
			createEditor({
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
			}),
		)

		const nodes = useSlateNodes({
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
			<ContemberElementRefreshContext.Provider value={renderCountRef.current}>
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
					>
						<HoveringToolbar blockButtons={blockButtons} otherBlockButtons={otherBlockButtons} />
					</EditorCanvas>
				</Slate>
			</ContemberElementRefreshContext.Provider>
		)
	},
)
BlockEditorInner.displayName = 'BlockEditorInner'
