import * as React from 'react'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../essentials'
import { ParagraphElement } from './ParagraphElement'
import { ParagraphRendererProps } from './ParagraphRenderer'

export interface WithParagraphs<E extends WithAnotherNodeType<BaseEditor, ParagraphElement>> {
	isParagraph: (element: ElementNode) => element is ParagraphElement
	paragraphRenderer: React.FunctionComponent<ParagraphRendererProps>
}

export type EditorWithParagraphs<E extends BaseEditor> = WithAnotherNodeType<E, ParagraphElement> &
	WithParagraphs<WithAnotherNodeType<E, ParagraphElement>>
