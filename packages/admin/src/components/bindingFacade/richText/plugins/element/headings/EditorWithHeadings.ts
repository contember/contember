import { BaseEditor, ElementNode, ElementSpecifics, WithAnotherNodeType } from '../../../baseEditor'
import { HeadingElement } from './HeadingElement'

export interface WithHeadings<E extends WithAnotherNodeType<BaseEditor, HeadingElement>> {
	isHeading: (element: ElementNode, suchThat?: Partial<ElementSpecifics<HeadingElement>>) => element is HeadingElement
	getNumberedHeadingSection: (element: HeadingElement) => number[]
}

export type EditorWithHeadings<E extends BaseEditor> = WithAnotherNodeType<E, HeadingElement> &
	WithHeadings<WithAnotherNodeType<E, HeadingElement>>
