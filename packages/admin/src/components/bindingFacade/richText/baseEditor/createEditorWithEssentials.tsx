import React from 'react'
import { createEditor, Editor, Element as SlateElement } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'
import { ContemberEditor } from '../ContemberEditor'
import { BaseEditor } from './BaseEditor'
import { DefaultElement } from './DefaultElement'
import {
	ElementNode,
	ElementSpecifics,
	SerializableEditorNode,
	TextNode,
	TextSpecifics,
	UnderlyingEditor,
} from './Node'
import { overrideDeleteBackward } from './overrides'

export const createEditorWithEssentials = (defaultElementType: string): BaseEditor => {
	const underlyingEditor: UnderlyingEditor = withHistory(withReact(createEditor())) as BaseEditor
	const editorWithEssentials = underlyingEditor as BaseEditor

	editorWithEssentials.formatVersion = 0
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

	editorWithEssentials.serializeElements = (elements, errorMessage) => {
		try {
			const serialized: SerializableEditorNode = {
				formatVersion: editorWithEssentials.formatVersion,
				children: elements,
			}
			return JSON.stringify(serialized)
		} catch (e) {
			throw new Error(errorMessage || `Editor: serialization error`)
		}
	}
	editorWithEssentials.deserializeElements = (serializedElement, errorMessage) => {
		try {
			const elementCandidate: SerializableEditorNode | SlateElement = JSON.parse(serializedElement)
			return 'formatVersion' in elementCandidate
				? (elementCandidate as SerializableEditorNode).children
				: [elementCandidate]
		} catch (e) {
			throw new Error(errorMessage || `Editor: deserialization error`)
		}
	}

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
