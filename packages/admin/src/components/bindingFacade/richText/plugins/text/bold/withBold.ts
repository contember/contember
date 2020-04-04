import isHotkey from 'is-hotkey'
import * as React from 'react'
import { BaseEditor } from '../../../baseEditor'

export const boldMark = 'isBold'

export const withBold = <E extends BaseEditor>(editor: E): E => {
	const { onKeyDown, renderLeafChildren } = editor

	const isBoldHotkey = isHotkey('mod+b')

	editor.renderLeafChildren = props => {
		const children = renderLeafChildren(props)

		if (props.leaf[boldMark] === true) {
			return React.createElement('b', undefined, children)
		}
		return children
	}

	editor.onKeyDown = event => {
		// TODO use onDOMBeforeInput for this
		if (isBoldHotkey(event.nativeEvent)) {
			editor.toggleMarks({ [boldMark]: true })
			event.preventDefault()
		}
		onKeyDown(event)
	}

	return editor
}
