import isHotkey from 'is-hotkey'
import { createElement } from 'react'
import type { BaseEditor } from '../../../baseEditor'

export const codeMark = 'isCode'

export const withCode = <E extends BaseEditor>(editor: E): E => {
	const { onKeyDown, renderLeafChildren } = editor

	const isBoldHotkey = isHotkey('mod+`')

	editor.renderLeafChildren = props => {
		const children = renderLeafChildren(props)

		if (props.leaf[codeMark] === true) {
			return createElement('code', undefined, children)
		}
		return children
	}

	editor.onKeyDown = event => {
		// TODO use onDOMBeforeInput for this
		if (isBoldHotkey(event.nativeEvent)) {
			editor.toggleMarks({ [codeMark]: true })
			event.preventDefault()
		}
		onKeyDown(event)
	}

	return editor
}
