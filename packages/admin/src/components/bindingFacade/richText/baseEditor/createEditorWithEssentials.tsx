import React from 'react'
import { createEditor } from 'slate'
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

	Object.assign<BaseEditor, Partial<BaseEditor>>(editorWithEssentials, {
		formatVersion: 0,
		defaultElementType,
		isDefaultElement: element => element.type === defaultElementType,
		createDefaultElement: children => ({
			type: defaultElementType,
			children,
		}),

		canToggleMarks: () => true,
		canToggleElement: <E extends ElementNode>() => true,

		hasMarks: <T extends TextNode>(marks: TextSpecifics<T>) => ContemberEditor.hasMarks(editorWithEssentials, marks),
		isElementActive: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => false, // TODO

		toggleMarks: <T extends TextNode>(marks: TextSpecifics<T>) => {
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
		},
		toggleElement: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => {}, // TODO

		serializeElements: (elements, errorMessage) =>
			ContemberEditor.serializeElements(editorWithEssentials, elements, errorMessage),
		deserializeElements: (serializedElement, errorMessage) =>
			ContemberEditor.deserializeElements(editorWithEssentials, serializedElement, errorMessage),

		renderElement: props => React.createElement(DefaultElement, props),

		renderLeafChildren: props => props.children,
		renderLeaf: props => React.createElement('span', props.attributes, editorWithEssentials.renderLeafChildren(props)),

		// Just noop functions so that other plugins can safely bubble-call
		onDOMBeforeInput: () => {},
		onKeyDown: () => {},
		onFocus: () => {},
		onBlur: () => {},
	})

	overrideDeleteBackward(editorWithEssentials)

	return editorWithEssentials as BaseEditor
}
