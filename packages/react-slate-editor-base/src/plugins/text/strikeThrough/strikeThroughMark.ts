import { createElement } from 'react'
import { isHotkey } from 'is-hotkey'
import { EditorMarkPlugin } from '../../../types'

export const strikeThroughMark = 'isStruckThrough'
export const strikeThroughPlugin: EditorMarkPlugin = {
	type: strikeThroughMark,
	render: ({ children }) => createElement('s', undefined, children),
	isHotKey: isHotkey('mod+opt+s'),
}
