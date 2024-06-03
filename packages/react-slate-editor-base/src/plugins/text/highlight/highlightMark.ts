import { isHotkey } from 'is-hotkey'
import { createElement } from 'react'
import { EditorMarkPlugin } from '../../../types'

export const highlightMark = 'isHighlighted'

export const highlightMarkPlugin: EditorMarkPlugin = {
	type: highlightMark,
	isHotKey: isHotkey('mod+e'),
	render: ({ children }) => createElement('em', undefined, children),
}
