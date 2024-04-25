import { CustomMarkPlugin } from '../../../baseEditor'
import { isHotkey } from 'is-hotkey'
import { createElement } from 'react'

export const highlightMark = 'isHighlighted'

export const highlightMarkPlugin: CustomMarkPlugin = {
	type: highlightMark,
	isHotKey: isHotkey('mod+e'),
	render: ({ children }) => createElement('em', undefined, children),
}
