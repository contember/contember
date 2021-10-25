import type { CustomElementPlugin } from '../../../baseEditor'
import { Editor as SlateEditor, Editor, Element as SlateElement, Node as SlateNode, Transforms } from 'slate'
import { ContemberEditor } from '../../../ContemberEditor'
import { ListItemRenderer } from './ListItemRenderer'
import { isListElement } from './ListElement'

export const listItemElementType = 'listItem' as const

export interface ListItemElement extends SlateElement {
	type: typeof listItemElementType
	children: SlateEditor['children']
}

export const isListItemElement = (
	element: SlateNode,
	suchThat?: Partial<ListItemElement>,
): element is ListItemElement => ContemberEditor.isElementType(element, listItemElementType, suchThat)


export const listItemElementPlugin: CustomElementPlugin<ListItemElement> = {
	type: listItemElementType,
	render: ListItemRenderer,
	canContainAnyBlocks: true,
	normalizeNode: ({ editor, path, element }) => {
		const parentEntry = Editor.above(editor, { at: path })
		if (parentEntry === undefined || !isListElement(parentEntry[0])) {
			return Editor.withoutNormalizing(editor, () => {
				const defaultElement = editor.createDefaultElement([{ text: '' }])
				Transforms.wrapNodes(editor, defaultElement, {
					at: path,
				})
				Transforms.unwrapNodes(editor, {
					at: [...path, 0],
				})
			})
		}
		if (element.children.every(it => isListItemElement(it))) {
			Transforms.unwrapNodes(editor, {
				at: path,
			})
			return
		}
		if (element.children.length === 1) {
			const onlyChild = element.children[0]
			if (SlateElement.isElement(onlyChild) && editor.isDefaultElement(onlyChild)) {
				return Transforms.unwrapNodes(editor, {
					at: [...path, 0],
				})
			}
		}
		const firstChild = element.children[0]
		if (SlateElement.isElement(firstChild) && isListElement(firstChild)) {
			return Transforms.insertNodes(editor, editor.createDefaultElement([{ text: '' }]), {
				at: [...path, 0],
			})
		}
	},
}
