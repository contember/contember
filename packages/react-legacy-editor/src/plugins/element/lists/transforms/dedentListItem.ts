import { Editor, Element as SlateElement, Node as SlateNode, Path as SlatePath, Transforms } from 'slate'
import { ContemberEditor } from '../../../../ContemberEditor'
import type { ListItemElement } from '../ListItemElement'
import { indentListItem } from './indentListItem'
import { isListElement } from '../ListElement'
import { isListItemElement } from '../ListItemElement'

export const dedentListItem = (
	editor: Editor,
	listItem: ListItemElement,
	listItemPath: SlatePath,
): boolean => {
	const parentListPath = SlatePath.parent(listItemPath)
	const parentListElement = SlateNode.get(editor, parentListPath) as SlateElement
	const parentListChildrenCount = parentListElement.children.length
	const subsequentListItemCount = parentListChildrenCount - listItemPath[listItemPath.length - 1] - 1

	if (!isListElement(parentListElement) || parentListPath.length <= 1) {
		return false
	}
	const parentListItemPath = SlatePath.parent(parentListPath)
	const parentListItemElement = SlateNode.get(editor, parentListItemPath)

	if (!isListItemElement(parentListItemElement)) {
		return false
	}

	const grandParentListPath = SlatePath.parent(parentListItemPath)
	const grandParentListElement = SlateNode.get(editor, grandParentListPath)

	if (!isListElement(grandParentListElement)) {
		return false
	}
	const parentListElementSpecifics = ContemberEditor.elementToSpecifics(parentListElement)
	const parentAndGrandParentAreCompatible = ContemberEditor.isElementType(
		grandParentListElement,
		parentListElement.type,
		parentListElementSpecifics as any,
	)

	// TODO we need to handle following siblings!!!

	if (parentAndGrandParentAreCompatible) {
		const newListItemPath = SlatePath.next(parentListItemPath)
		Editor.withoutNormalizing(editor, () => {
			if (subsequentListItemCount) {
				const nextSiblingPath = SlatePath.next(listItemPath)
				for (let i = 0; i < subsequentListItemCount; i++) {
					const nextListItem = SlateNode.get(editor, nextSiblingPath) as ListItemElement
					indentListItem(editor, nextListItem, nextSiblingPath)
				}
			}
			Transforms.moveNodes(editor, {
				at: listItemPath,
				to: newListItemPath,
			})
			if (parentListChildrenCount === 1) {
				// We've just moved the last listItem away
				Transforms.removeNodes(editor, {
					at: parentListPath,
				})
			}
		})
		return true
	} else {
		// TODO this is recoverable: we can just append the list
	}

	return false // TODO stub
}
