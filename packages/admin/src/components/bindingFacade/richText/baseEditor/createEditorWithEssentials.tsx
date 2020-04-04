import React from 'react'
import { createEditor } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'
import { ContemberEditor } from '../ContemberEditor'
import { BaseEditor } from './BaseEditor'
import { DefaultElement } from './DefaultElement'
import { DefaultLeaf } from './DefaultLeaf'
import { ElementNode, ElementSpecifics, TextNode, TextSpecifics, UnderlyingEditor } from './Node'
import { overrideDeleteBackward } from './overrides'

export const createEditorWithEssentials = (defaultElementType: string): BaseEditor => {
	const underlyingEditor: UnderlyingEditor = withHistory(withReact(createEditor())) as BaseEditor
	const editorWithEssentials = underlyingEditor as BaseEditor

	editorWithEssentials.formatVersion = '0.0.0'
	editorWithEssentials.defaultElementType = defaultElementType
	editorWithEssentials.isDefaultElement = element => element.type === defaultElementType
	editorWithEssentials.createDefaultElement = children => ({
		type: defaultElementType,
		children,
	})

	// Default to restrictive
	editorWithEssentials.canToggleMark = () => false
	editorWithEssentials.canToggleElement = <E extends ElementNode>() => false

	editorWithEssentials.hasMarks = <T extends TextNode>(marks: TextSpecifics<T>) =>
		ContemberEditor.hasMarks(editorWithEssentials, marks)
	editorWithEssentials.isElementActive = <E extends ElementNode>(
		elementType: E['type'],
		suchThat?: ElementSpecifics<E>,
	) => false // TODO

	editorWithEssentials.toggleElement = <E extends ElementNode>(
		elementType: E['type'],
		suchThat?: ElementSpecifics<E>,
	) => {} // TODO

	editorWithEssentials.renderElement = props => React.createElement(DefaultElement, props)
	editorWithEssentials.renderLeaf = props => React.createElement(DefaultLeaf, props)

	// Just noop functions so that other plugins can safely bubble-call
	editorWithEssentials.onDOMBeforeInput = () => {}
	editorWithEssentials.onKeyDown = () => {}
	editorWithEssentials.onFocus = () => {}
	editorWithEssentials.onBlur = () => {}

	overrideDeleteBackward(editorWithEssentials)

	return editorWithEssentials as BaseEditor
}
