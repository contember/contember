import { createElement } from 'react'
import { CustomMarkPlugin } from '../../../baseEditor'
import isHotkey from 'is-hotkey'

export const boldMark = 'isBold'

export const boldMarkPlugin: CustomMarkPlugin = {
	type: boldMark,
	isHotKey: isHotkey('mod+b'),
	render: ({ children }) => createElement('b', undefined, children),
}
