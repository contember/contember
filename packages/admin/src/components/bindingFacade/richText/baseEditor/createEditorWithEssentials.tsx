import React from 'react'
import { createEditor, Editor } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'
import { ContemberEditor } from '../ContemberEditor'
import { BaseEditor } from './BaseEditor'
import { DefaultElement } from './DefaultElement'
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

	editorWithEssentials.canToggleMarks = () => true
	editorWithEssentials.canToggleElement = <E extends ElementNode>() => true

	editorWithEssentials.hasMarks = <T extends TextNode>(marks: TextSpecifics<T>) =>
		ContemberEditor.hasMarks(editorWithEssentials, marks)
	editorWithEssentials.isElementActive = <E extends ElementNode>(
		elementType: E['type'],
		suchThat?: ElementSpecifics<E>,
	) => false // TODO

	editorWithEssentials.toggleMarks = <T extends TextNode>(marks: TextSpecifics<T>) => {
		if (!editorWithEssentials.canToggleMarks(marks)) {
			return
		}
		const isActive = editorWithEssentials.hasMarks(marks)
		if (isActive) {
			ContemberEditor.removeMarks(editorWithEssentials, marks)
			return false
		}
		ContemberEditor.addMarks(editorWithEssentials, marks)
		return true
	}
	editorWithEssentials.toggleElement = <E extends ElementNode>(
		elementType: E['type'],
		suchThat?: ElementSpecifics<E>,
	) => {} // TODO

	editorWithEssentials.renderElement = props => React.createElement(DefaultElement, props)

	editorWithEssentials.renderLeafChildren = props => props.children
	editorWithEssentials.renderLeaf = props =>
		React.createElement('span', props.attributes, editorWithEssentials.renderLeafChildren(props))

	// Just noop functions so that other plugins can safely bubble-call
	editorWithEssentials.onDOMBeforeInput = () => {}
	editorWithEssentials.onKeyDown = () => {}
	editorWithEssentials.onFocus = () => {}
	editorWithEssentials.onBlur = () => {}

	overrideDeleteBackward(editorWithEssentials)

	return editorWithEssentials as BaseEditor
}
