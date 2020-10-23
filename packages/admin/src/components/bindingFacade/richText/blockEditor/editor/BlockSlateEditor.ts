import { EntityAccessor, FieldValue } from '@contember/binding'
import { Node } from 'slate'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../baseEditor'
import {
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
	isBlockVoidReferenceElement: (node: Node) => node is BlockVoidReferenceElement
	isContemberContentPlaceholderElement: (node: Node) => node is ContemberContentPlaceholderElement
	isEmbedElement: (node: Node) => node is EmbedElement
	isContemberFieldElement: (node: Node) => node is ContemberFieldElement
	insertElementWithReference: <Element extends ElementNode>(
		element: Omit<Element, 'referenceId'>,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => void
}

export type EditorWithBlockElements<E extends BaseEditor> = WithAnotherNodeType<E, BlockEditorElements> &
	WithBlockElements<WithAnotherNodeType<E, BlockEditorElements>>

export type BlockSlateEditor = EditorWithBlockElements<BaseEditor>
