import * as React from 'react'
import { Editor, Node as SlateNode, Range as SlateRange, Transforms } from 'slate'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../../baseEditor'
import { AnchorElement } from './AnchorElement'
import { AnchorRenderer, AnchorRendererProps } from './AnchorRenderer'
import { EditorWithAnchors, WithAnchors } from './EditorWithAnchors'
import { isUrl } from './isUrl'

export const withAnchors = <E extends BaseEditor>(editor: E): EditorWithAnchors<E> => {
	type BaseAnchorEditor = WithAnotherNodeType<E, AnchorElement>

	const e: E & Partial<WithAnchors<BaseAnchorEditor>> = editor
	const { isInline, insertText, insertData, renderElement } = editor

	const isAnchor = (element: SlateNode | ElementNode): element is AnchorElement => element.type === 'anchor'
	const isAnchorActive = (editor: BaseAnchorEditor) => {
		const [link] = Editor.nodes(editor, { match: isAnchor })
		return !!link
	}
	const unwrapAnchor = (editor: BaseAnchorEditor) => {
		Transforms.unwrapNodes(editor, { match: isAnchor })
	}
	const wrapAnchor = (editor: BaseAnchorEditor, url: string) => {
		if (isAnchorActive(editor)) {
			unwrapAnchor(editor)
		}

		const selection = editor.selection
		const isCollapsed = selection ? SlateRange.isCollapsed(selection!) : false
		const anchor: AnchorElement = {
			type: 'anchor',
			href: url,
			children: isCollapsed ? [{ text: url }] : [{ text: '' }],
		}

		if (isCollapsed) {
			Transforms.insertNodes(editor, anchor)
		} else {
			Transforms.wrapNodes(editor, anchor, { split: true })
			Transforms.collapse(editor, { edge: 'end' })
		}
	}

	e.isAnchor = isAnchor
	e.isAnchorActive = isAnchorActive
	e.wrapAnchor = wrapAnchor
	e.unwrapAnchor = unwrapAnchor
	e.renderElement = props => {
		if (isAnchor(props.element)) {
			return React.createElement(AnchorRenderer, props as AnchorRendererProps)
		}
		return renderElement(props)
	}

	e.isInline = element => {
		if (isAnchor(element)) {
			return true
		}
		return isInline(element)
	}
	e.insertText = text => {
		if (text && isUrl(text)) {
			wrapAnchor((e as unknown) as BaseAnchorEditor, text)
		} else {
			insertText(text)
		}
	}
	e.insertData = data => {
		const text = data.getData('text/plain')

		if (text && isUrl(text)) {
			wrapAnchor((e as unknown) as BaseAnchorEditor, text)
		} else {
			insertData(data)
		}
	}

	return (e as unknown) as EditorWithAnchors<E>
}
