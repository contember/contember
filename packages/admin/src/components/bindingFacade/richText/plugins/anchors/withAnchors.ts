import * as React from 'react'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../essentials'
import { AnchorElement } from './AnchorElement'
import { AnchorRenderer, AnchorRendererProps } from './AnchorRenderer'
import { EditorWithAnchors, WithAnchors } from './EditorWithAnchors'

export const withAnchors = <E extends BaseEditor>(editor: E): EditorWithAnchors<E> => {
	const e: E & Partial<WithAnchors<WithAnotherNodeType<E, AnchorElement>>> = editor
	const { isInline, renderElement } = editor

	const isAnchor = (element: ElementNode): element is AnchorElement => element.type === 'anchor'

	e.isAnchor = isAnchor
	e.anchorRenderer = AnchorRenderer
	e.renderElement = props => {
		if (isAnchor(props.element)) {
			return React.createElement(AnchorRenderer, props as AnchorRendererProps)
		}
		return renderElement(props)
	}

	editor.isInline = element => {
		if (isAnchor(element)) {
			return true
		}
		return isInline(element)
	}

	return (e as unknown) as EditorWithAnchors<E>
}
