import { isHotkey } from 'is-hotkey'
import { createElement } from 'react'
import { EditorMarkPlugin } from '../../../types'

export const italicMark = 'isItalic'

export const italicMarkPlugin: EditorMarkPlugin = {
	type: italicMark,
	isHotKey: isHotkey('mod+i'),
	render: ({ children }) => createElement('i', undefined, children),
}
