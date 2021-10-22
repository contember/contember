import { Editor, Element, Element as SlateElement, Node, Path as SlatePath } from 'slate'
import { isUnorderedListElement, UnorderedListElement } from './UnorderedListElement'
import { isOrderedListElement, OrderedListElement } from './OrderedListElement'
import { ContemberEditor } from '../../../ContemberEditor'
import { isListItemElement } from './ListItemElement'

export const isListElement = <T extends UnorderedListElement | OrderedListElement>(
	element: Node,
	suchThat?: Partial<T>,
): element is T => isOrderedListElement(element, suchThat as Partial<OrderedListElement>) || isUnorderedListElement(element, suchThat as Partial<UnorderedListElement>)

export const getParentListElement = (editor: Editor): Element | undefined => {
	const closestNonDefaultEntry = ContemberEditor.closest(editor, {
		match: node => Editor.isBlock(editor, node) && !editor.isDefaultElement(node),
	})
	if (!closestNonDefaultEntry) {
		return undefined
	}
	const [closestNonDefaultElement, closestNonDefaultPath] = closestNonDefaultEntry
	if (isListItemElement(closestNonDefaultElement)) {
		return Editor.node(editor, SlatePath.parent(closestNonDefaultPath))[0] as SlateElement
	} else if (isListElement(closestNonDefaultElement)) {
		return closestNonDefaultElement
	}
	return undefined
}
