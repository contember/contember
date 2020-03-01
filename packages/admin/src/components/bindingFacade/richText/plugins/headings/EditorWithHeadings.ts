import { Node as SlateNode } from 'slate'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../essentials'
import { HeadingElement } from './HeadingElement'

export interface WithHeadings<E extends WithAnotherNodeType<BaseEditor, HeadingElement>> {
	isHeading: (element: ElementNode) => element is HeadingElement
	isWithinHeading: (level: HeadingElement['level']) => boolean
	toggleHeading: (level: HeadingElement['level'], matchRoot?: (node: SlateNode) => boolean) => void
}

export type EditorWithHeadings<E extends BaseEditor> = WithAnotherNodeType<E, HeadingElement> &
	WithHeadings<WithAnotherNodeType<E, HeadingElement>>
