import isHotkey from 'is-hotkey'
import { createElement } from 'react'
import { Editor as SlateEditor } from 'slate'

export const highlightMark = 'isHighlighted'

export const withHighlight = <E extends SlateEditor>(editor: E): E => {
	const { onKeyDown, renderLeafChildren } = editor

	const isBoldHotkey = isHotkey('mod+e')

	editor.renderLeafChildren = props => {
		const children = renderLeafChildren(props)

		if (props.leaf[highlightMark] === true) {
			return createElement('em', undefined, children)
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
