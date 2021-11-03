import type { CustomElementPlugin } from '../../../baseEditor'
import { Editor as SlateEditor, Node as SlateNode, Element as SlateElement } from 'slate'
import { ContemberEditor } from '../../../ContemberEditor'
import { OrderedListRenderer } from './OrderedListRenderer'
import { getParentListElement } from './ListElement'
import { unorderedListElementType } from './UnorderedListElement'
import { normalizeListElement, toggleListElement } from './transforms'

export const orderedListElementType = 'orderedList' as const

export interface OrderedListElement extends SlateElement {
	type: typeof orderedListElementType
	children: SlateEditor['children']
}

export const isOrderedListElement = (
	element: SlateNode,
	suchThat?: Partial<OrderedListElement>,
): element is OrderedListElement => ContemberEditor.isElementType(element, orderedListElementType, suchThat)

export const orderedListElementPlugin: CustomElementPlugin<OrderedListElement> = {
	type: orderedListElementType,
	render: OrderedListRenderer,
	isActive: ({ editor }) => {
		const list = getParentListElement(editor)
		return list ?  isOrderedListElement(list) : false
	},
	toggleElement: ({ editor, suchThat }) => {
		toggleListElement(editor, orderedListElementType, suchThat, unorderedListElementType)
	},
	normalizeNode: normalizeListElement,
}
