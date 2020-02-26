import * as React from 'react'
import { Node as SlateNode } from 'slate'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../essentials'
import { EditorWithHeadings, WithHeadings } from './EditorWithHeadings'
import { HeadingElement } from './HeadingElement'
import { HeadingRenderer, HeadingRendererProps } from './HeadingRenderer'

export const withHeadings = <E extends BaseEditor>(editor: E): EditorWithHeadings<E> => {
	const e: E & Partial<WithHeadings<WithAnotherNodeType<E, HeadingElement>>> = editor
	const { renderElement } = editor

	const isHeading = (element: SlateNode | ElementNode): element is HeadingElement => element.type === 'heading'

	e.isHeading = isHeading

	e.renderElement = props => {
		if (isHeading(props.element)) {
			return React.createElement(HeadingRenderer, props as HeadingRendererProps)
		}
		return renderElement(props)
	}

	return (e as unknown) as EditorWithHeadings<E>
}
