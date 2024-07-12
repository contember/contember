import { Editor as SlateEditor, Element as SlateElement, Node as SlateNode } from 'slate'
import { ContemberEditor } from '../../../editor'
import { getParentListElement } from './ListElement'
import { orderedListElementType } from './OrderedListElement'
import { normalizeListElement, toggleListElement } from './transforms'
import { EditorElementPlugin, ElementRenderer } from '../../../types'

export const unorderedListElementType = 'unorderedList' as const

export interface UnorderedListElement extends SlateElement {
	type: typeof unorderedListElementType
	children: SlateEditor['children']
}

export const isUnorderedListElement = (
	element: SlateNode,
	suchThat?: Partial<UnorderedListElement>,
): element is UnorderedListElement => ContemberEditor.isElementType(element, unorderedListElementType, suchThat)

export const unorderedListElementPlugin = ({ render }: { render: ElementRenderer<UnorderedListElement> }): EditorElementPlugin<UnorderedListElement> => ({
	type: unorderedListElementType,
	render,
	isActive: ({ editor, suchThat }) => {
		const list = getParentListElement(editor)
		return list ? isUnorderedListElement(list, suchThat) : false
	},
	toggleElement: ({ editor, suchThat }) => {
		toggleListElement(editor, unorderedListElementType, suchThat, orderedListElementType)
	},
	normalizeNode: normalizeListElement,
})
