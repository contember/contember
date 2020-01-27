import React from 'react'
import { createEditor } from 'slate'
import { withReact } from 'slate-react'
import { BaseEditor } from './BaseEditor'
import { DefaultElement } from './DefaultElement'
import { DefaultLeaf } from './DefaultLeaf'

export const createEditorWithEssentials = (): BaseEditor => {
	const editor: Partial<BaseEditor> = withReact(createEditor())

	editor.formatVersion = '0.0.0'
	editor.renderElement = props => React.createElement(DefaultElement, props)
	editor.renderLeaf = props => React.createElement(DefaultLeaf, props)

	return editor as BaseEditor
}
