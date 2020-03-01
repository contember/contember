import { BaseEditor, ElementNode, WithAnotherNodeType } from '../essentials'
import { HeadingElement } from './HeadingElement'

export interface WithHeadings<E extends WithAnotherNodeType<BaseEditor, HeadingElement>> {
	isHeading: (element: ElementNode, level?: HeadingElement['level']) => element is HeadingElement
	isWithinHeading: (level?: HeadingElement['level']) => boolean
	toggleHeading: (level: HeadingElement['level']) => void
}

export type EditorWithHeadings<E extends BaseEditor> = WithAnotherNodeType<E, HeadingElement> &
	WithHeadings<WithAnotherNodeType<E, HeadingElement>>
