import { isHotkey } from 'is-hotkey'
import { createElement } from 'react'
import { EditorMarkPlugin } from '../../../types'

export const underlineMark = 'isUnderlined'

export const underlineMarkPlugin: EditorMarkPlugin = {
	type: underlineMark,
	isHotKey: isHotkey('mod+u'),
	render: ({ children }) => createElement('u', undefined, children),
}
