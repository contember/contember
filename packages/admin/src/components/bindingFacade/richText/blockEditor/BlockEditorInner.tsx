import {
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	RemovalType,
	SugaredRelativeSingleField,
	useDesugaredRelativeSingleField,
	useEnvironment,
	useMutationState,
	useSortedEntities,
	VariableInputTransformer,
} from '@contember/binding'
import { Box } from '@contember/ui'
import * as React from 'react'
import { Element } from 'slate'
import { Editable, RenderElementProps, Slate } from 'slate-react'
import { LiteralBasedBlockProps, ScalarBasedBlockProps, useNormalizedBlocks } from '../../blocks'
import { RepeaterProps } from '../../collections'
import { HoveringToolbar } from '../toolbars'
import { createEditor } from './createEditor'
import { BlockEditorElementRenderer } from './renderers'
import { useSlateNodes } from './useSlateNodes'

export interface BlockEditorInnerPublicProps {
	children: React.ReactNode
	label: React.ReactNode
	removalType?: RemovalType
	sortableBy: Exclude<RepeaterProps['sortableBy'], undefined>

	discriminationField: string | SugaredRelativeSingleField
	textBlockField: string | SugaredRelativeSingleField
	textBlockDiscriminatedBy?: LiteralBasedBlockProps['discriminateBy']
	textBlockDiscriminatedByScalar?: ScalarBasedBlockProps['discriminateByScalar']
	// TODO configure marks
	// TODO configure elements
}

export interface BlockEditorInnerInternalProps {
	entityList: EntityListAccessor
}

export type BlockEditorInnerProps = BlockEditorInnerPublicProps & BlockEditorInnerInternalProps

export const BlockEditorInner = React.memo(
	({
		entityList,
		children,
		discriminationField,
		sortableBy,
		label,
		removalType = 'disconnect',
		textBlockDiscriminatedBy,
		textBlockDiscriminatedByScalar,
		textBlockField,
	}: BlockEditorInnerProps) => {
		const isMutating = useMutationState()
		const environment = useEnvironment()

		const desugaredDiscriminationField = useDesugaredRelativeSingleField(discriminationField)
		const desugaredTextBlockField = useDesugaredRelativeSingleField(textBlockField)
		const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)

		const { entities, moveEntity, appendNew } = useSortedEntities(entityList, sortableBy)

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
		const [elementCache] = React.useState(() => new WeakMap<EntityAccessor, Element>())

		const entityListRef = React.useRef(entityList)
		const isMutatingRef = React.useRef(isMutating)
		const sortedEntitiesRef = React.useRef(entities)

		entityListRef.current = entityList
		isMutatingRef.current = isMutating
		sortedEntitiesRef.current = entities

		const editor = React.useMemo(
			() =>
				createEditor({
					entityListRef,
					isMutatingRef,
					sortedEntitiesRef,
					textBlockDiscriminant,
					discriminationField: desugaredDiscriminationField,
					sortableByField: desugaredSortableByField,
					textBlockField: desugaredTextBlockField,
					elementCache,
					removalType,
				}),
			[
				// These are here just so that the linter is happy. In practice, they shouldn't change.
				desugaredDiscriminationField,
				desugaredSortableByField,
				desugaredTextBlockField,
				elementCache,
				removalType,
				textBlockDiscriminant,
			],
		)
		const editorRenderElement = editor.renderElement
		const renderElement = React.useCallback(
			(props: RenderElementProps) => (
				<BlockEditorElementRenderer
					normalizedBlocks={normalizedBlocks}
					fallbackRenderer={editorRenderElement}
					element={props.element}
					attributes={props.attributes}
					children={props.children}
					discriminationField={desugaredDiscriminationField}
				/>
			),
			[desugaredDiscriminationField, editorRenderElement, normalizedBlocks],
		)

		const nodes = useSlateNodes({
			discriminationField: desugaredDiscriminationField,
			elementCache,
			textBlockField: desugaredTextBlockField,
			blocks: normalizedBlocks,
			textBlockDiscriminant,
			entities,
		})
		const onChange = React.useCallback(() => {}, [])

		return (
			<Slate editor={editor} value={nodes} onChange={onChange}>
				<Box heading={label}>
					<Editable renderElement={renderElement} renderLeaf={editor.renderLeaf} onKeyDown={editor.onKeyDown} />
					<HoveringToolbar />
				</Box>
			</Slate>
		)
	},
)
BlockEditorInner.displayName = 'BlockEditorInner'
