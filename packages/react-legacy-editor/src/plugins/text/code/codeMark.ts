import { CustomMarkPlugin } from '../../../baseEditor'
import { isHotkey } from 'is-hotkey'
import { createElement } from 'react'

export const codeMark = 'isCode'

export const codeMarkPlugin: CustomMarkPlugin = {
	type: codeMark,
	isHotKey: isHotkey('mod+`'),
	render: ({ children }) => createElement('code', undefined, children),
}
