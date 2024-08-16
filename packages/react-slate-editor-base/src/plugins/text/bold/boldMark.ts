import { createElement } from 'react'
import { isHotkey } from 'is-hotkey'
import { EditorMarkPlugin } from '../../../types'

export const boldMark = 'isBold'

export const boldMarkPlugin: EditorMarkPlugin = {
	type: boldMark,
	isHotKey: isHotkey('mod+b'),
	render: ({ children }) => createElement('b', undefined, children),
}
