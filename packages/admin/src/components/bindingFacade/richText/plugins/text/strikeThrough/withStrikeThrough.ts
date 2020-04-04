import isHotkey from 'is-hotkey'
import * as React from 'react'
import { BaseEditor } from '../../../baseEditor'

export const strikeThroughMark = 'isStruckThrough'

export const withStrikeThrough = <E extends BaseEditor>(editor: E): E => {
	const { onKeyDown, renderLeafChildren } = editor

	const isStruckThroughHotkey = isHotkey('mod+opt+s')

	editor.renderLeafChildren = props => {
		const children = renderLeafChildren(props)

		if (props.leaf[strikeThroughMark] === true) {
			return React.createElement('s', undefined, children)
		}
		return children
	}

	editor.onKeyDown = event => {
		// TODO use onDOMBeforeInput for this
		if (isStruckThroughHotkey(event.nativeEvent)) {
			editor.toggleMarks({ [strikeThroughMark]: true })
			event.preventDefault()
		}
		onKeyDown(event)
	}

	return editor
}
