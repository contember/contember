import { EntityAccessor, FieldValue } from '@contember/binding'
import * as Slate from 'slate'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../baseEditor'
import {
	BlockReferenceElement,
	BlockVoidReferenceElement,
	ContemberContentPlaceholderElement,
	ContemberFieldElement,
	EmbedElement,
} from '../elements'

export type BlockEditorElements =
	| BlockVoidReferenceElement
	| ContemberContentPlaceholderElement
	| ContemberFieldElement
	| EmbedElement

export interface WithBlockElements<E extends WithAnotherNodeType<BaseEditor, BlockEditorElements>> {
	slate: typeof Slate
	isBlockReferenceElement: (node: Slate.Node) => node is BlockReferenceElement
	isBlockVoidReferenceElement: (node: Slate.Node) => node is BlockVoidReferenceElement
	isContemberContentPlaceholderElement: (node: Slate.Node) => node is ContemberContentPlaceholderElement
	isEmbedElement: (node: Slate.Node) => node is EmbedElement
	isContemberFieldElement: (node: Slate.Node) => node is ContemberFieldElement
	createElementReference: (referenceDiscriminant: FieldValue, initialize?: EntityAccessor.BatchUpdatesHandler) => string
	insertElementWithReference: <Element extends ElementNode>(
		element: Omit<Element, 'referenceId'>,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => void
	slateOnChange: () => void
}

export type EditorWithBlockElements<E extends BaseEditor> = WithAnotherNodeType<E, BlockEditorElements> &
	WithBlockElements<WithAnotherNodeType<E, BlockEditorElements>>

export type BlockSlateEditor = EditorWithBlockElements<BaseEditor>
