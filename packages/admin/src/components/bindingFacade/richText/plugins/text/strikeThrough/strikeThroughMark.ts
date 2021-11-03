import { CustomMarkPlugin } from '../../../baseEditor'
import { createElement } from 'react'
import isHotkey from 'is-hotkey'

export const strikeThroughMark = 'isStruckThrough'
export const strikeThroughPlugin: CustomMarkPlugin = {
	type: strikeThroughMark,
	render: ({ children }) => createElement('s', undefined, children),
	isHotKey: isHotkey('mod+opt+s'),
}
