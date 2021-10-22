import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	NodeEntry,
	Path as SlatePath,
	Text,
	Transforms,
} from 'slate'
import { ContemberEditor } from '../../../../ContemberEditor'
import type { ListItemElement } from '../ListItemElement'
import type { OrderedListElement } from '../OrderedListElement'
import type { UnorderedListElement } from '../UnorderedListElement'

export const indentListItem = (
	editor: Editor,
	listItem: ListItemElement,
	listItemPath: SlatePath,
): boolean => {
	const previousListEntry = ContemberEditor.getPreviousSibling<Editor, ListItemElement>(
		editor,
		listItem,
		listItemPath,
	)
	if (previousListEntry === undefined) {
		return false
	}

	Editor.withoutNormalizing(editor, () => {
		const [parentListElement] = Editor.parent(editor, listItemPath) as NodeEntry<
			OrderedListElement | UnorderedListElement
		>
		let [previousListItem, previousListItemPath] = previousListEntry

		const lastPreviousListItemChild = previousListItem.children[previousListItem.children.length - 1]
		const previousEndsWithCompatibleList =
			SlateElement.isElement(lastPreviousListItemChild) &&
			ContemberEditor.isElementType(
				lastPreviousListItemChild,
				parentListElement.type,
				ContemberEditor.elementToSpecifics(parentListElement) as any,
			)

		if (previousEndsWithCompatibleList) {
			const newListItemPath = [
				...previousListItemPath,
				previousListItem.children.length - 1,
				(lastPreviousListItemChild as UnorderedListElement | OrderedListElement).children.length,
			]

			Transforms.moveNodes(editor, {
				at: listItemPath,
				to: newListItemPath,
			})
		} else {
			const previousContainsInlines = Editor.hasInlines(editor, previousListItem)
			if (previousContainsInlines) {
				const [previousStart, previousEnd] = Editor.edges(editor, previousListItemPath)
				Transforms.wrapNodes(editor, editor.createDefaultElement([]), {
					match: node => Text.isText(node) || (SlateElement.isElement(node) && editor.isInline(node)),
					at: {
						anchor: previousStart,
						focus: previousEnd,
					},
				})
			}
			// Getting a new previousListItem because the children may have changed due to the branch above.
			previousListItem = SlateNode.get(editor, previousListItemPath) as ListItemElement
			// We're appending at the end: children.length is just lastOne + 1
			const newListItemPath = [...previousListItemPath, previousListItem.children.length]

			Transforms.moveNodes(editor, {
				at: listItemPath,
				to: newListItemPath,
			})
			Transforms.wrapNodes(editor, { ...parentListElement, children: [] }, { at: newListItemPath })
		}
	})

	return true
}
