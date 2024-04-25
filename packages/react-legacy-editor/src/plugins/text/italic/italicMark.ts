import { CustomMarkPlugin } from '../../../baseEditor'
import { isHotkey } from 'is-hotkey'
import { createElement } from 'react'

export const italicMark = 'isItalic'

export const italicMarkPlugin: CustomMarkPlugin = {
	type: italicMark,
	isHotKey: isHotkey('mod+i'),
	render: ({ children }) => createElement('i', undefined, children),
}
