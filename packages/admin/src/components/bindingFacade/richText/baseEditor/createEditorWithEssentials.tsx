import React from 'react'
import { createEditor, Editor, Path, Range as SlateRange, Transforms } from 'slate'
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
			ContemberEditor.permissivelyDeserializeElements(editorWithEssentials, serializedElement, errorMessage),

		renderElement: props => React.createElement(DefaultElement, props),

		renderLeafChildren: props => props.children,
		renderLeaf: props => React.createElement('span', props.attributes, editorWithEssentials.renderLeafChildren(props)),

		// Just noop functions so that other plugins can safely bubble-call
		onDOMBeforeInput: () => {},
		onKeyDown: e => {
			// Inline void nodes cannot be deleted by default: https://github.com/ianstormtaylor/slate/issues/3456
			// This is a hack to get around this issue. The problem is that when an inline void node is selected, Slate's
			// beforeInput handler doesn't get triggered. However, when we put the caret right after the inline void
			// and press Backspace (or the other way around with Delete), it works just fine. Furthermore, if we deleted the
			// node directly, either we'd lose the selection state or Slate, not knowing about us deleting, would still
			// try to delete things on its own so as to respond to the user interaction. So we take advantage of this and
			// instead of deleting the void node, we just carefully move the selection and have Slate do the deleting.
			if (e.key !== 'Delete' && e.key !== 'Backspace') {
				return
			}
			const selection = editorWithEssentials.selection

			if (selection && SlateRange.isCollapsed(selection)) {
				const voidEntry = Editor.void(editorWithEssentials, {
					at: selection,
					mode: 'lowest',
					voids: true,
				})
				if (!voidEntry) {
					return
				}
				const [node, nodePath] = voidEntry
				if (editorWithEssentials.isInline(node)) {
					const adjacentPoint =
						e.key === 'Backspace'
							? Editor.point(editorWithEssentials, Path.next(nodePath), {
									edge: 'start',
							  })
							: Editor.point(editorWithEssentials, Path.previous(nodePath), {
									edge: 'end',
							  })
					Transforms.select(editorWithEssentials, adjacentPoint)
				}
			}
		},
		onFocus: () => {},
		onBlur: () => {},
	})

	overrideDeleteBackward(editorWithEssentials)

	return editorWithEssentials as BaseEditor
}
