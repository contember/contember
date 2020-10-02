import { Editor, Element as SlateElement, Node as SlateNode, Path as SlatePath, Text, Transforms } from 'slate'
import { BaseEditor } from '../../../../baseEditor'
import { ContemberEditor } from '../../../../ContemberEditor'
import { EditorWithLists } from '../EditorWithLists'
import { ListItemElement } from '../ListItemElement'
import { OrderedListElement } from '../OrderedListElement'
import { UnorderedListElement } from '../UnorderedListElement'

export const indentListItem = (
	editor: EditorWithLists<BaseEditor>,
	listItem: ListItemElement,
	listItemPath: SlatePath,
): boolean => {
	const previousListEntry = ContemberEditor.getPreviousSibling<EditorWithLists<BaseEditor>, ListItemElement>(
		editor,
		listItem,
		listItemPath,
	)
	if (previousListEntry === undefined) {
		return false
	}

	Editor.withoutNormalizing(editor, () => {
		const [parentListElement] = Editor.parent(editor, listItemPath)
		let [previousListItem, previousListItemPath] = previousListEntry

		const lastPreviousListItemChild = previousListItem.children[previousListItem.children.length - 1]
		const previousEndsWithCompatibleList =
			SlateElement.isElement(lastPreviousListItemChild) &&
			editor.isList(lastPreviousListItemChild, ContemberEditor.elementToSpecifics(parentListElement))

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
					match: node => Text.isText(node) || editor.isInline(node),
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
