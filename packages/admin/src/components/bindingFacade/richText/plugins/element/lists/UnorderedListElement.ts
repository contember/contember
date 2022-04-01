import { CustomElementPlugin } from '../../../baseEditor'
import { Editor as SlateEditor, Node as SlateNode, Element as SlateElement } from 'slate'
import { ContemberEditor } from '../../../ContemberEditor'
import { getParentListElement } from './ListElement'
import { orderedListElementType } from './OrderedListElement'
import { UnorderedListRenderer } from './UnorderedListRenderer'
import { normalizeListElement, toggleListElement } from './transforms'

export const unorderedListElementType = 'unorderedList' as const

export interface UnorderedListElement extends SlateElement {
	type: typeof unorderedListElementType
	children: SlateEditor['children']
}

export const isUnorderedListElement = (
	element: SlateNode,
	suchThat?: Partial<UnorderedListElement>,
): element is UnorderedListElement => ContemberEditor.isElementType(element, unorderedListElementType, suchThat)

export const unorderedListElementPlugin: CustomElementPlugin<UnorderedListElement> = {
	type: unorderedListElementType,
	render: UnorderedListRenderer,
	isActive: ({ editor, suchThat }) => {
		const list = getParentListElement(editor)
		return list ? isUnorderedListElement(list, suchThat) : false
	},
	toggleElement: ({ editor, suchThat }) => {
		toggleListElement(editor, unorderedListElementType, suchThat, orderedListElementType)
	},
	normalizeNode: normalizeListElement,
}
