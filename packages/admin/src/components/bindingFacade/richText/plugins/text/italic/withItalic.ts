import isHotkey from 'is-hotkey'
import * as React from 'react'
import { BaseEditor } from '../../../baseEditor'

export const italicMark = 'isItalic'

export const withItalic = <E extends BaseEditor>(editor: E): E => {
	const { onKeyDown, renderLeafChildren } = editor

	const isItalicHotkey = isHotkey('mod+i')

	editor.renderLeafChildren = props => {
		const children = renderLeafChildren(props)

		if (props.leaf[italicMark] === true) {
			return React.createElement('i', undefined, children)
		}
		return children
	}

	editor.onKeyDown = event => {
		// TODO use onDOMBeforeInput for this
		if (isItalicHotkey(event.nativeEvent)) {
			editor.toggleMarks({ [italicMark]: true })
			event.preventDefault()
		}
		onKeyDown(event)
	}

	return editor
}
