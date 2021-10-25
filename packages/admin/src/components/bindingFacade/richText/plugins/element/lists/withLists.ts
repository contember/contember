import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	Path as SlatePath,
	Range as SlateRange,
	Text,
	Transforms,
} from 'slate'
import { EditorPasteUtils, NodesWithType } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import { isListItemElement, ListItemElement, listItemElementPlugin, listItemElementType } from './ListItemElement'
import { orderedListElementPlugin, orderedListElementType } from './OrderedListElement'
import { dedentListItem, indentListItem } from './transforms'
import { unorderedListElementPlugin, unorderedListElementType } from './UnorderedListElement'
import { isListElement } from './ListElement'

export const withLists = <E extends Editor>(editor: E): Editor => {
	const {
		insertBreak,
		onKeyDown,
	} = editor

	editor.registerElement(listItemElementPlugin)
	editor.registerElement(orderedListElementPlugin)
	editor.registerElement(unorderedListElementPlugin)

	Object.assign<Editor, Partial<Editor>>(editor, {
		insertBreak: () => {
			const { selection } = editor

			if (!selection || !SlateRange.isCollapsed(selection)) {
				return insertBreak()
			}
			const closestBlockEntry = ContemberEditor.closestBlockEntry(editor)
			if (closestBlockEntry === undefined) {
				return insertBreak()
			}
			const [closestBlock, closestBlockPath] = closestBlockEntry

			let containingListItem: ListItemElement
			let containingListItemPath: SlatePath

			if (!isListItemElement(closestBlock)) {
				if (closestBlockPath.length < 2) {
					// This block cannot be inside a list
					return insertBreak()
				}

				containingListItemPath = SlatePath.parent(closestBlockPath)
				const closestListItem = SlateNode.get(editor, containingListItemPath)

				if (!isListItemElement(closestListItem)) {
					// The block is not inside a list
					return insertBreak()
				}
				containingListItem = closestListItem
			} else {
				containingListItem = closestBlock
				containingListItemPath = closestBlockPath
			}

			if (SlateNode.string(containingListItem) !== '') {
				return Transforms.splitNodes(editor, {
					always: true,
					at: selection.focus,
					match: node => isListItemElement(node),
				})
			}

			// We're in a list and want to leave this list.

			const containingListPath = SlatePath.parent(containingListItemPath)
			const containingList = SlateNode.get(editor, containingListPath)

			if (!isListElement(containingList)) {
				// This shouldn't really happen. It's more of a sanity check.
				return insertBreak()
			}

			const followingListItemPath = SlatePath.next(containingListItemPath)
			const hasFollowingListItem = SlateNode.has(editor, followingListItemPath)

			if (hasFollowingListItem) {
				const followingListItemNode = SlateNode.get(editor, followingListItemPath)
				if (!isListItemElement(followingListItemNode)) {
					// This shouldn't really happen. It's more of a sanity check.
					return insertBreak()
				}
				if (containingListItemPath[containingListItemPath.length - 1] === 0) {
					// We're at the beginning of a list
					Editor.withoutNormalizing(editor, () => {
						// Remove the trailing empty listItem
						Transforms.removeNodes(editor, { at: containingListItemPath })
						Transforms.insertNodes(editor, editor.createDefaultElement([{ text: '' }]), { at: containingListPath, select: true })
					})
				} else {
					// We're in the middle of a list.
					Editor.withoutNormalizing(editor, () => {
						Transforms.removeNodes(editor, { at: containingListItemPath })
						Transforms.splitNodes(editor, { at: containingListItemPath })
						const afterListParent = SlatePath.next(containingListPath)
						Transforms.insertNodes(editor, editor.createDefaultElement([{ text: '' }]), { at: afterListParent, select: true })
					})
				}
			} else {
				// We're at the end of a list.
				Editor.withoutNormalizing(editor, () => {
					const afterListParent = SlatePath.next(containingListPath)
					// Remove the trailing empty listItem
					Transforms.removeNodes(editor, { at: containingListItemPath })
					Transforms.insertNodes(editor, editor.createDefaultElement([{ text: '' }]), { at: afterListParent, select: true })
				})
			}
		},
		onKeyDown: event => {
			// TODO this should also work for expanded selections
			if (
				(event.key !== 'Tab' && event.key !== 'Enter') ||
				!editor.selection ||
				!SlateRange.isCollapsed(editor.selection)
			) {
				return onKeyDown(event)
			}
			const selection = editor.selection
			const closestBlockEntry = ContemberEditor.closestBlockEntry(editor, { at: selection.focus })

			if (closestBlockEntry === undefined) {
				return onKeyDown(event)
			}
			let [closestBlockElement, closestBlockPath] = closestBlockEntry
			if (!SlateElement.isElement(closestBlockElement)) {
				return onKeyDown(event)
			}

			if (event.key === 'Tab') {
				if (editor.isDefaultElement(closestBlockElement)) {
					[closestBlockElement, closestBlockPath] = Editor.parent(editor, closestBlockPath)
				}
				if (!isListItemElement(closestBlockElement)) {
					return onKeyDown(event)
				}
				const succeeded = event.shiftKey
					? dedentListItem(editor, closestBlockElement, closestBlockPath)
					: indentListItem(editor, closestBlockElement, closestBlockPath)

				if (succeeded) {
					return event.preventDefault()
				}
			} else if (event.key === 'Enter' && event.shiftKey) {
				if (editor.isDefaultElement(closestBlockElement)) {
					const [listItem] = Editor.parent(editor, closestBlockPath)
					if (!isListItemElement(listItem)) {
						return onKeyDown(event)
					}
					event.preventDefault()
					return Transforms.splitNodes(editor, {
						always: true,
						at: selection.focus,
						match: node => Editor.isBlock(editor, node) && editor.isDefaultElement(node),
					})
				} else if (isListItemElement(closestBlockElement)) {
					// We want to create a newline but the closest block is the list item.
					// This should mean that it only contains inlines. Hence we wrap them in a default element
					// and then split it.
					const [listItemStart, listItemEnd] = Editor.edges(editor, closestBlockPath)
					event.preventDefault()
					return Editor.withoutNormalizing(editor, () => {
						Transforms.wrapNodes(editor, editor.createDefaultElement([]), {
							match: node => Text.isText(node) || (SlateElement.isElement(node) && editor.isInline(node)),
							at: {
								anchor: listItemStart,
								focus: listItemEnd,
							},
						})
						const relative = SlatePath.relative(selection.focus.path, closestBlockPath)
						Transforms.splitNodes(editor, {
							// The zero should be the newly created default element.
							at: {
								path: [...closestBlockPath, 0, ...relative],
								offset: selection.focus.offset,
							},
							always: true,
						})
					})
				}
			}
			return onKeyDown(event)
		},
	})



	return editor
}
