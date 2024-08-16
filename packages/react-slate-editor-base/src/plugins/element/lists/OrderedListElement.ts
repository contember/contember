import { Editor as SlateEditor, Element as SlateElement, Node as SlateNode } from 'slate'
import { ContemberEditor } from '../../../editor'
import { getParentListElement } from './ListElement'
import { unorderedListElementType } from './UnorderedListElement'
import { normalizeListElement, toggleListElement } from './transforms'
import { EditorElementPlugin, ElementRenderer } from '../../../types'

export const orderedListElementType = 'orderedList' as const

export interface OrderedListElement extends SlateElement {
	type: typeof orderedListElementType
	children: SlateEditor['children']
}

export const isOrderedListElement = (
	element: SlateNode,
	suchThat?: Partial<OrderedListElement>,
): element is OrderedListElement => ContemberEditor.isElementType(element, orderedListElementType, suchThat)

export const orderedListElementPlugin = ({ render }: { render: ElementRenderer<OrderedListElement> }): EditorElementPlugin<OrderedListElement> => ({
	type: orderedListElementType,
	render,
	isActive: ({ editor, suchThat }) => {
		const list = getParentListElement(editor)
		return list ? isOrderedListElement(list, suchThat) : false
	},
	toggleElement: ({ editor, suchThat }) => {
		toggleListElement(editor, orderedListElementType, suchThat, unorderedListElementType)
	},
	normalizeNode: normalizeListElement,
})
