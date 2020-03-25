import { BaseEditor, ElementNode, ElementSpecifics, WithAnotherNodeType } from '../essentials'
import { HeadingElement } from './HeadingElement'

export interface WithHeadings<E extends WithAnotherNodeType<BaseEditor, HeadingElement>> {
	isHeading: (element: ElementNode, suchThat?: Partial<ElementSpecifics<HeadingElement>>) => element is HeadingElement
	isWithinHeading: (suchThat?: Partial<ElementSpecifics<HeadingElement>>) => boolean
	toggleHeading: (suchThat?: Partial<ElementSpecifics<HeadingElement>>) => void
	getNumberedHeadingSection: (element: HeadingElement) => number[]
}

export type EditorWithHeadings<E extends BaseEditor> = WithAnotherNodeType<E, HeadingElement> &
	WithHeadings<WithAnotherNodeType<E, HeadingElement>>
