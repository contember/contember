import { isHotkey } from 'is-hotkey'
import { createElement } from 'react'
import { EditorMarkPlugin } from '../../../types'

export const codeMark = 'isCode'

export const codeMarkPlugin: EditorMarkPlugin = {
	type: codeMark,
	isHotKey: isHotkey('mod+`'),
	render: ({ children }) => createElement('code', undefined, children),
}
