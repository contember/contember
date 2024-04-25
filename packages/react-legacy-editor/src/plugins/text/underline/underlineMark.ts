import { CustomMarkPlugin } from '../../../baseEditor'
import { isHotkey } from 'is-hotkey'
import { createElement } from 'react'

export const underlineMark = 'isUnderlined'

export const underlineMarkPlugin: CustomMarkPlugin = {
	type: underlineMark,
	isHotKey: isHotkey('mod+u'),
	render: ({ children }) => createElement('u', undefined, children),
}
