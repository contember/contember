import { isHotkey } from 'is-hotkey'
import { createElement } from 'react'
import { EditorMarkPlugin } from '../../../types/index.js'

export const underlineMark = 'isUnderlined'

export const underlineMarkPlugin: EditorMarkPlugin = {
	type: underlineMark,
	isHotKey: isHotkey('mod+u'),
	render: ({ children }) => createElement('u', undefined, children),
}
