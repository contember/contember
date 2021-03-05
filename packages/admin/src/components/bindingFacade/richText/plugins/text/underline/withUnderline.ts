import isHotkey from 'is-hotkey'
import { createElement } from 'react'
import { BaseEditor } from '../../../baseEditor'

export const underlineMark = 'isUnderlined'

export const withUnderline = <E extends BaseEditor>(editor: E): E => {
	const { onKeyDown, renderLeafChildren } = editor

	const isUnderlinedHotkey = isHotkey('mod+u')

	editor.renderLeafChildren = props => {
		const children = renderLeafChildren(props)

		if (props.leaf[underlineMark] === true) {
			return createElement('u', undefined, children)
		}
		return children
	}

	editor.onKeyDown = event => {
		// TODO use onDOMBeforeInput for this
		if (isUnderlinedHotkey(event.nativeEvent)) {
			editor.toggleMarks({ [underlineMark]: true })
			event.preventDefault()
		}
		onKeyDown(event)
	}

	return editor
}
