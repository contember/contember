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
import { ReactEditor, withReact } from 'slate-react'
import { ContemberEditor } from '../ContemberEditor'
import { DefaultElement } from './DefaultElement'
import type { TextSpecifics } from './Node'
import { overrideDeleteBackward, withPaste } from './overrides'
import { CustomElementPlugin } from './CustomElementPlugin'
import { CustomMarkPlugin } from './CustomMarkPlugin'

export const createEditorWithEssentials = (defaultElementType: string): Editor => {
	const underlyingEditor = withHistory(withReact(createEditor() as ReactEditor))

	const editor = underlyingEditor as unknown as Editor
	const { normalizeNode, isInline, isVoid } = editor

	const elements = new Map<string, CustomElementPlugin<any>>()
	const marks = new Map<string, CustomMarkPlugin>()

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
		isElementActive: <E extends SlateElement>(elementType: E['type'], suchThat?: Partial<E>) => {
			return (
				elements.get(elementType)?.isActive?.({ editor, suchThat })
				?? Array.from(Editor.nodes(editor, {
					match: node => SlateElement.isElement(node) && ContemberEditor.isElementType(node, elementType, suchThat),
					voids: false,
				})).length > 0
			)
		},

		acceptsAttributes: <E extends SlateElement>(elementType: E['type'], suchThat: Partial<E>) => {
			return elements.get(elementType)?.acceptsAttributes?.({ editor, suchThat }) ?? false
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
		toggleElement: <E extends SlateElement>(elementType: E['type'], suchThat?: Partial<E>) => {
			elements.get(elementType)?.toggleElement?.({
				editor,
				suchThat,
			})
		},

		isInline: element => {
			return elements.get(element.type)?.isInline ?? isInline(element)
		},

		isVoid: element => {
			const elIsVoid = elements.get(element.type)?.isVoid
			if (elIsVoid === undefined) {
				return isVoid(element)
			}
			if (typeof elIsVoid === 'boolean') {
				return elIsVoid
			}
			return elIsVoid({ editor, element })
		},

		canContainAnyBlocks: element => {
			if (Editor.isEditor(element)) {
				return true
			}
			return !editor.isInline(element)
				&& !editor.isVoid(element)
				&& (elements.has(element.type) ? elements.get(element.type)!.canContainAnyBlocks ?? false : true)
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
			return createElement(elements.get(props.element.type)?.render ?? DefaultElement, props)
		},

		renderLeafChildren: props => props.children,

		renderLeaf: props => {
			let el = createElement('span', props.attributes, editor.renderLeafChildren(props))
			for (const [, mark] of marks) {
				if (props.leaf[mark.type] === true) {
					const markerEl = mark.render({ ...props, children: el })
					if (markerEl !== null) {
						el = markerEl
					}
				}
			}
			return el
		},

		// Just noop functions so that other plugins can safely bubble-call
		onDOMBeforeInput: () => {},
		onKeyDown: e => {
			for (const [, mark] of marks) {
				if (mark.isHotKey(e.nativeEvent)) {
					editor.toggleMarks({ [mark.type]: true })
					e.preventDefault()
					return
				}
			}


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
			if (Editor.isEditor(node) && node.children.length === 0) {
				Transforms.insertNodes(editor, editor.createDefaultElement([{ text: '' }]))
			}
			if (!SlateElement.isElement(node)) {
				normalizeNode([node, path])
				return
			}
			let defaultPrevented = false
			elements.get(node.type)?.normalizeNode?.({
				element: node,
				path,
				editor,
				preventDefault: () => {
					defaultPrevented = true
				},
			})
			if (!defaultPrevented) {
				normalizeNode([node, path])
			}
		},
		registerElement: plugin => {
			elements.set(plugin.type, plugin)
		},
		registerMark: plugin => {
			marks.set(plugin.type, plugin)
		},
	})

	overrideDeleteBackward(editor)

	withPaste(editor)

	return editor
}
