import * as React from 'react'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../essentials'
import { HeadingElement } from './HeadingElement'
import { HeadingRendererProps } from './HeadingRenderer'

export interface WithHeadings<E extends WithAnotherNodeType<BaseEditor, HeadingElement>> {
	isHeading: (element: ElementNode) => element is HeadingElement
	headingRenderer: React.FunctionComponent<HeadingRendererProps>
}

export type EditorWithHeadings<E extends BaseEditor> = WithAnotherNodeType<E, HeadingElement> &
	WithHeadings<WithAnotherNodeType<E, HeadingElement>>
