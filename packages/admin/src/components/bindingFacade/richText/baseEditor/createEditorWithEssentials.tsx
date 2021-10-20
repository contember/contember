import { createElement } from 'react'
import {
	createEditor,
	Descendant,
	Editor,
	Element as SlateElement,
	Path,
	Range as SlateRange,
	Text as SlateText,
	Transforms,
} from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'
import { ContemberEditor } from '../ContemberEditor'
import { DefaultElement } from './DefaultElement'
import type { ElementSpecifics, TextSpecifics, UnderlyingEditor } from './Node'
import { overrideDeleteBackward, withPaste } from './overrides'
import { ReactEditor } from 'slate-react'
import { CustomElementPlugin } from './CustomElementPlugin'

export const createEditorWithEssentials = (defaultElementType: string): Editor => {
	const underlyingEditor: UnderlyingEditor = withHistory(withReact(createEditor() as ReactEditor))

	const editor = underlyingEditor as unknown as Editor
	const { normalizeNode, isInline, isVoid } = editor

	const elements: Record<string, CustomElementPlugin<any>> = {}

	Object.assign<Editor, Partial<Editor>>(editor, {
		formatVersion: 1,
		defaultElementType,
		isDefaultElement: element => 'type' in element && (element as any).type === defaultElementType,
		createDefaultElement: children => ({
			type: defaultElementType,
			children,
		}),
		insertBetweenBlocks: ([element, path], edge) => {
			const edgeOffset = edge === 'before' ? 0 : 1
			const targetPath = path.slice(0, -1).concat(path[path.length - 1] + edgeOffset)
			Transforms.insertNodes(editor, editor.createDefaultElement([{ text: '' }]), {
				at: targetPath,
				select: true,
			})
		},

		canToggleMarks: () => true,
		canToggleElement: <E extends SlateElement>() => true,

		hasMarks: <T extends SlateText>(marks: TextSpecifics<T>) => ContemberEditor.hasMarks(editor, marks),

		// TODO in the following function, we need to conditionally trim the selection so that it doesn't potentially
		// 	include empty strings at the edges of top-level elements.
		isElementActive: <E extends SlateElement>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => {
			return (
				elements[elementType]?.isActive?.({ editor, suchThat })
				?? Array.from(ContemberEditor.topLevelNodes(editor))
						.every(([node]) => ContemberEditor.isElementType(node, elementType, suchThat))
			)
		},

		toggleMarks: <T extends SlateText>(marks: TextSpecifics<T>) => {
			if (!editor.canToggleMarks(marks)) {
				return
			}
			const isActive = editor.hasMarks(marks)
			if (isActive) {
				ContemberEditor.removeMarks(editor, marks)
				return false
			}
			ContemberEditor.addMarks(editor, marks)
			return true
		},
		toggleElement: <E extends SlateElement>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => {
			elements[elementType].toggleElement?.({
				editor,
				suchThat,
			})
		},

		isInline: element => {
			return elements[element.type]?.isInline ?? isInline(element)
		},

		isVoid: element => {
			return elements[element.type]?.isVoid ?? isVoid(element)
		},

		canContainAnyBlocks: element => {
			return !editor.isInline(element)
				&& !editor.isVoid(element)
				&& (elements[element.type] ? elements[element.type].canContainAnyBlocks ?? false : true)
		},

		serializeNodes: (nodes, errorMessage) => ContemberEditor.serializeNodes(editor, nodes, errorMessage),
		deserializeNodes: (serializedNodes, errorMessage) =>
			ContemberEditor.permissivelyDeserializeNodes(editor, serializedNodes, errorMessage),

		upgradeFormatBySingleVersion: (node, oldVersion) => {
			if (SlateElement.isElement(node)) {
				return {
					...node,
					children: node.children.map(child => editor.upgradeFormatBySingleVersion(child, oldVersion) as Descendant),
				}
			}
			return node
		},

		renderElement: props => {
			if (elements[props.element.type]) {
				return createElement(elements[props.element.type].render, props)
			}
			return createElement(DefaultElement, props)
		},

		renderLeafChildren: props => props.children,
		renderLeaf: props => createElement('span', props.attributes, editor.renderLeafChildren(props)),

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
			const selection = editor.selection

			if (selection && SlateRange.isCollapsed(selection)) {
				const voidEntry = Editor.void(editor, {
					at: selection,
					mode: 'lowest',
					voids: true,
				})
				if (!voidEntry) {
					return
				}
				const [node, nodePath] = voidEntry
				if (editor.isInline(node)) {
					const adjacentPoint =
						e.key === 'Backspace'
							? Editor.point(editor, Path.next(nodePath), {
									edge: 'start',
							  })
							: Editor.point(editor, Path.previous(nodePath), {
									edge: 'end',
							  })
					Transforms.select(editor, adjacentPoint)
				}
			}
		},
		onFocus: () => {},
		onBlur: () => {},
		normalizeNode: ([node, path]) => {
			if (SlateElement.isElement(node) && elements[node.type]?.normalizeNode) {
				elements[node.type].normalizeNode?.({
					element: node,
					path,
					editor,
				})
			} else {
				normalizeNode([node, path])
			}
		},
		registerElement: plugin => {
			elements[plugin.type] = plugin
		},
	})

	overrideDeleteBackward(editor)

	withPaste(editor)

	return editor
}
