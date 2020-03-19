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
import { usePreviousValue } from '../../../../utils'
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
	trailingFieldBackedElements: NormalizedFieldBackedElement[]
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
		leadingFieldBackedElements,
		trailingFieldBackedElements,
	}: BlockEditorInnerProps) => {
		const renderCountRef = React.useRef(0)
		const dataTreeIdRef = React.useRef(0)

		const isMutating = useMutationState()
		const environment = useEnvironment()

		const desugaredDiscriminationField = useDesugaredRelativeSingleField(discriminationField)
		const desugaredTextBlockField = useDesugaredRelativeSingleField(textBlockField)
		const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)

		const previousEntityListAccessor = usePreviousValue(entityListAccessor)

		// If this is true, we're rendering for other reasons than that entityListAccessor has changed.
		const isDataBasedRender =
			previousEntityListAccessor === undefined || previousEntityListAccessor !== entityListAccessor

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

		const entityListAccessorRef = React.useRef(entityListAccessor)
		const isMutatingRef = React.useRef(isMutating)
		const sortedEntitiesRef = React.useRef(entities)
		const normalizedBlocksRef = React.useRef(normalizedBlocks)
		const normalizedLeadingFieldsRef = React.useRef(leadingFieldBackedElements)
		const normalizedTrailingFieldsRef = React.useRef(trailingFieldBackedElements)

		entityListAccessorRef.current = entityListAccessor
		isMutatingRef.current = isMutating
		sortedEntitiesRef.current = entities
		normalizedLeadingFieldsRef.current = leadingFieldBackedElements
		normalizedTrailingFieldsRef.current = trailingFieldBackedElements

		const editor = React.useMemo(
			() =>
				createEditor({
					batchUpdates,
					desugaredEntityList,
					entityListAccessorRef,
					fieldElementCache: contemberFieldElementCache,
					isMutatingRef,
					sortedEntitiesRef,
					normalizedBlocksRef,
					normalizedLeadingFieldsRef,
					normalizedTrailingFieldsRef,
					textBlockDiscriminant,
					discriminationField: desugaredDiscriminationField,
					sortableByField: desugaredSortableByField,
					textBlockField: desugaredTextBlockField,
					textElementCache,
					removalType,
				}),
			[
				// These are here just so that the linter is happy. In practice, they shouldn't change. Ever.
				batchUpdates,
				contemberFieldElementCache,
				desugaredEntityList,
				desugaredDiscriminationField,
				desugaredSortableByField,
				desugaredTextBlockField,
				removalType,
				textBlockDiscriminant,
				textElementCache,
			],
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
			trailingFieldBackedElements,
		})

		React.useEffect(() => {
			// This is a horrific hotfix and a hack. For some reason, the editor and the DOM get out of sync in some way
			// after a persist. That starts causing caret jumping that I suspect are similar to the problems described in
			// https://www.mutuallyhuman.com/blog/the-curious-case-of-cursor-jumping/
			// While this still needs more investigation as it clearly points to a more fundamental problem, it appears that
			// for the time being, we can just get around the problem by re-mounting the whole sub-tree through use of
			// the key prop.
			// This is not only hacky in in the sense that we perform any re-mounting at all, but also in the way we decide
			// when to do that. This whole thing needs changed.
			if (isMutating && !isDataBasedRender) {
				dataTreeIdRef.current++
			}
		}, [isDataBasedRender, isMutating])

		// TODO label?
		return (
			<ContemberElementRefreshContext.Provider
				key={dataTreeIdRef.current} // See the effect above
				value={(renderCountRef.current += Number(isDataBasedRender))} // No need to force the re-render if the data hasn't changed.
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
					>
						<HoveringToolbar blockButtons={blockButtons} otherBlockButtons={otherBlockButtons} />
					</EditorCanvas>
				</Slate>
			</ContemberElementRefreshContext.Provider>
		)
	},
)
BlockEditorInner.displayName = 'BlockEditorInner'
