import type { BaseEditor, ElementNode, ElementSpecifics, WithAnotherNodeType } from '../../../baseEditor'
import type { ParagraphElement } from './ParagraphElement'

export interface WithParagraphs<E extends WithAnotherNodeType<BaseEditor, ParagraphElement>> {
	isParagraph: (
		element: ElementNode,
		suchThat?: Partial<ElementSpecifics<ParagraphElement>>,
	) => element is ParagraphElement
}

export type EditorWithParagraphs<E extends BaseEditor> = WithAnotherNodeType<E, ParagraphElement> &
	WithParagraphs<WithAnotherNodeType<E, ParagraphElement>>
