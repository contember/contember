import React from 'react'
import { createEditor } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'
import { BaseEditor } from './BaseEditor'
import { DefaultElement } from './DefaultElement'
import { DefaultLeaf } from './DefaultLeaf'
import { UnderlyingEditor } from './Node'

export const createEditorWithEssentials = (): BaseEditor => {
	const underlyingEditor: UnderlyingEditor = withHistory(withReact(createEditor()))
	const editorWithEssentials: Partial<BaseEditor> = underlyingEditor

	editorWithEssentials.formatVersion = '0.0.0'
	editorWithEssentials.renderElement = props => React.createElement(DefaultElement, props)
	editorWithEssentials.renderLeaf = props => React.createElement(DefaultLeaf, props)

	return editorWithEssentials as BaseEditor
}
