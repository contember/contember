import { Node } from 'slate'
import { BaseEditor, WithAnotherNodeType } from '../../baseEditor'
import { EditorWithAnchors, EditorWithBasicFormatting, EditorWithHeadings, EditorWithParagraphs } from '../../plugins'
import { ContemberBlockElement, ContemberContentPlaceholderElement, ContemberFieldElement } from '../elements'

export type BlockEditorElements = ContemberBlockElement | ContemberFieldElement | ContemberContentPlaceholderElement

export interface WithBlockElements<E extends WithAnotherNodeType<BaseEditor, BlockEditorElements>> {
	isContemberBlockElement: (node: Node) => node is ContemberBlockElement
	isContemberContentPlaceholderElement: (node: Node) => node is ContemberContentPlaceholderElement
	isContemberFieldElement: (node: Node) => node is ContemberFieldElement
}

export type EditorWithBlockElements<E extends BaseEditor> = WithAnotherNodeType<E, BlockEditorElements> &
	WithBlockElements<WithAnotherNodeType<E, BlockEditorElements>>

export type BlockSlateEditor = EditorWithBlockElements<
	EditorWithHeadings<EditorWithParagraphs<EditorWithAnchors<EditorWithBasicFormatting<BaseEditor>>>>
>
