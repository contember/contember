import { Node } from 'slate'
import { BaseEditor, WithAnotherNodeType } from '../../baseEditor'
import {
	ContemberBlockElement,
	ContemberContentPlaceholderElement,
	ContemberEmbedElement,
	ContemberFieldElement,
} from '../elements'

export type BlockEditorElements =
	| ContemberBlockElement
	| ContemberFieldElement
	| ContemberEmbedElement
	| ContemberContentPlaceholderElement

export interface WithBlockElements<E extends WithAnotherNodeType<BaseEditor, BlockEditorElements>> {
	isContemberBlockElement: (node: Node) => node is ContemberBlockElement
	isContemberContentPlaceholderElement: (node: Node) => node is ContemberContentPlaceholderElement
	isContemberEmbedElement: (node: Node) => node is ContemberEmbedElement
	isContemberFieldElement: (node: Node) => node is ContemberFieldElement
}

export type EditorWithBlockElements<E extends BaseEditor> = WithAnotherNodeType<E, BlockEditorElements> &
	WithBlockElements<WithAnotherNodeType<E, BlockEditorElements>>

export type BlockSlateEditor = EditorWithBlockElements<BaseEditor>
