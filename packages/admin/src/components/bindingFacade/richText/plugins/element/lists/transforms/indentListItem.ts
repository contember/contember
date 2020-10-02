import { Editor, Node as SlateNode, Path as SlatePath, Text, Transforms } from 'slate'
import { BaseEditor } from '../../../../baseEditor'
import { ContemberEditor } from '../../../../ContemberEditor'
import { EditorWithLists } from '../EditorWithLists'
import { ListItemElement } from '../ListItemElement'

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
	let [previousListItem, previousListItemPath] = previousListEntry
	const previousContainsInlines = Editor.hasInlines(editor, previousListItem)
	const [parentListElement] = Editor.parent(editor, listItemPath)

	Editor.withoutNormalizing(editor, () => {
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
	})

	return true
}
