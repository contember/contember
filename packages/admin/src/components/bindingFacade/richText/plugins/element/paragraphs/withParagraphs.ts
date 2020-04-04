import * as React from 'react'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../essentials'
import { EditorWithParagraphs, WithParagraphs } from './EditorWithParagraphs'
import { ParagraphElement, paragraphElementType } from './ParagraphElement'
import { ParagraphRenderer, ParagraphRendererProps } from './ParagraphRenderer'

export const withParagraphs = <E extends BaseEditor>(editor: E): EditorWithParagraphs<E> => {
	const e: E & Partial<WithParagraphs<WithAnotherNodeType<E, ParagraphElement>>> = editor
	const { renderElement } = editor

	const isParagraph = (element: ElementNode): element is ParagraphElement => element.type === paragraphElementType

	e.isParagraph = isParagraph

	e.renderElement = props => {
		if (isParagraph(props.element)) {
			return React.createElement(ParagraphRenderer, props as ParagraphRendererProps)
		}
		return renderElement(props)
	}

	return e as EditorWithParagraphs<E>
}
