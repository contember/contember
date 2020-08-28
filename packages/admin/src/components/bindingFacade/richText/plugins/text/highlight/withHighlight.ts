import isHotkey from 'is-hotkey'
import * as React from 'react'
import { BaseEditor } from '../../../baseEditor'

export const highlightMark = 'isHighlighted'

export const withHighlight = <E extends BaseEditor>(editor: E): E => {
	const { onKeyDown, renderLeafChildren } = editor

	const isBoldHotkey = isHotkey('mod+e')

	editor.renderLeafChildren = props => {
		const children = renderLeafChildren(props)

		if (props.leaf[highlightMark] === true) {
			return React.createElement('em', undefined, children)
		}
		return children
	}

	editor.onKeyDown = event => {
		// TODO use onDOMBeforeInput for this
		if (isBoldHotkey(event.nativeEvent)) {
			editor.toggleMarks({ [highlightMark]: true })
			event.preventDefault()
		}
		onKeyDown(event)
	}

	return editor
}
