import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../../baseEditor'
import { ParagraphElement } from './ParagraphElement'

export interface WithParagraphs<E extends WithAnotherNodeType<BaseEditor, ParagraphElement>> {
	isParagraph: (element: ElementNode) => element is ParagraphElement
}

export type EditorWithParagraphs<E extends BaseEditor> = WithAnotherNodeType<E, ParagraphElement> &
	WithParagraphs<WithAnotherNodeType<E, ParagraphElement>>
