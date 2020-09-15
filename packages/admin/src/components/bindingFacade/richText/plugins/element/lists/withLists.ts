import * as React from 'react'
import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	Path as SlatePath,
	Range as SlateRange,
	Transforms,
} from 'slate'
import { BaseEditor } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import { EditorWithLists } from './EditorWithLists'
import { ListItemElement, listItemElementType } from './ListItemElement'
import { OrderedListElement, orderedListElementType } from './OrderedListElement'
import { UnorderedListElement, unorderedListElementType } from './UnorderedListElement'

export const withLists = <E extends BaseEditor>(editor: E): EditorWithLists<E> => {
	const { renderElement, insertBreak, deleteBackward, normalizeNode, isElementActive, toggleElement } = editor

	const e = (editor as any) as EditorWithLists<E>

	Object.assign<EditorWithLists<BaseEditor>, Partial<EditorWithLists<BaseEditor>>>(e, {
		isListItem: (element, suchThat): element is ListItemElement => element.type === listItemElementType,
		isUnorderedList: (element, suchThat): element is UnorderedListElement => element.type === unorderedListElementType,
		isOrderedList: (element, suchThat): element is OrderedListElement => element.type === orderedListElementType,
		isList: (element, suchThat): element is OrderedListElement | UnorderedListElement =>
			element.type === unorderedListElementType || element.type === orderedListElementType,

		renderElement: props => {
			switch (props.element.type) {
				case listItemElementType:
					return React.createElement('li', props.attributes, props.children)
				case unorderedListElementType:
					return React.createElement('ul', props.attributes, props.children)
				case orderedListElementType:
					return React.createElement('ol', props.attributes, props.children)
				default:
					return renderElement(props)
			}
		},
		isElementActive: (elementType, suchThat) => {
			switch (elementType) {
				case listItemElementType:
					return false
				case unorderedListElementType:
					// TODO this is wonky and WILL fail for nested lists
					return Array.from(ContemberEditor.topLevelNodes(e)).every(([node]) => e.isUnorderedList(node, suchThat))
				case orderedListElementType:
					// TODO this is wonky and WILL fail for nested lists
					return Array.from(ContemberEditor.topLevelNodes(e)).every(([node]) => e.isOrderedList(node, suchThat))
				default:
					return isElementActive(elementType, suchThat)
			}
		},
		toggleElement: (elementType, suchThat) => {
			if (elementType === listItemElementType) {
				return // li's cannot be manually toggled
			}
			if (elementType !== unorderedListElementType && elementType !== orderedListElementType) {
				return toggleElement(elementType, suchThat)
			}
			const otherKindOfList = elementType === orderedListElementType ? unorderedListElementType : orderedListElementType

			if (e.isElementActive(elementType, suchThat) || e.isElementActive(otherKindOfList, suchThat)) {
				return // TODO nope. Just delete the list. :D
			}

			// TODO this is a grossly oversimplified implementation that just pulls a bunch of yolo assumptions ouf of a hat.
			//      Most notably, that lists won't be nested. We just need to roll the most basic case out for now though.
			Editor.withoutNormalizing(e, () => {
				const selectedNodes = Editor.nodes(editor, {
					match: node =>
						SlateElement.isElement(node) &&
						!e.isVoid(node) &&
						!e.isUnorderedList(node) &&
						!e.isOrderedList(node) &&
						!e.isListItem(node),
					mode: 'highest',
					voids: false,
				})

				for (const [, path] of selectedNodes) {
					ContemberEditor.ejectElement(e, path)
					Transforms.setNodes(
						e,
						{
							type: listItemElementType,
						},
						{
							at: path,
						},
					)
				}
				const emptyList: UnorderedListElement | OrderedListElement = {
					type: elementType as (UnorderedListElement | OrderedListElement)['type'],
					children: [],
				}
				Transforms.wrapNodes(e, emptyList)
			})
		},
		normalizeNode: entry => {
			const [node, path] = entry

			if (SlateElement.isElement(node)) {
				if (e.isList(node)) {
					for (const [child, childPath] of SlateNode.children(editor, path)) {
						if (SlateElement.isElement(child) && child.type !== listItemElementType) {
							ContemberEditor.ejectElement(editor, childPath)
							Transforms.setNodes(editor, { type: listItemElementType }, { at: childPath })
							return
						}
					}
				} else if (e.isListItem(node)) {
					const closestBlockEntry = ContemberEditor.closestBlockEntry(e, path)
					if (closestBlockEntry === undefined || !e.isList(closestBlockEntry[0])) {
						Editor.withoutNormalizing(e, () => {
							const defaultElement = e.createDefaultElement([{ text: '' }])
							Transforms.wrapNodes(e, defaultElement, {
								at: path,
							})
							Transforms.unwrapNodes(e, {
								at: [...path, 0],
							})
						})
					}
				}
			}

			normalizeNode(entry)
		},
		insertBreak: () => {
			const { selection } = editor

			if (!selection || !SlateRange.isCollapsed(selection)) {
				return insertBreak()
			}
			const [node, path] = Editor.node(editor, selection)

			if (SlateNode.string(node) !== '') {
				return insertBreak()
			}

			const closestListItemEntry = Editor.above(e, {
				mode: 'lowest',
				match: node => e.isListItem(node),
			})

			if (closestListItemEntry === undefined) {
				return insertBreak()
			}
			// We're in a list and want to leave this list.

			const [containingListItem, containingListItemPath] = closestListItemEntry

			const containingListPath = SlatePath.parent(containingListItemPath)
			const containingList = SlateNode.get(e, containingListPath)

			if (!e.isList(containingList)) {
				// This shouldn't really happen. It's more of a sanity check.
				return insertBreak()
			}

			const followingListItemPath = SlatePath.next(containingListItemPath)
			const hasFollowingListItem = SlateNode.has(e, followingListItemPath)

			const listParentEntry = Editor.above(e, {
				at: containingListPath,
				mode: 'lowest',
				match: node => e.isListItem(node),
			})

			if (hasFollowingListItem) {
				const followingListItemNode = SlateNode.get(e, followingListItemPath)
				if (!e.isListItem(followingListItemNode)) {
					// This shouldn't really happen. It's more of a sanity check.
					return insertBreak()
				}
				if (containingListItemPath[containingListItemPath.length - 1] === 0) {
					// We're at the beginning of a list
					if (listParentEntry !== undefined) {
						// This is a nested list
						// TODO
					} else {
						// We're not in a nested list
						Editor.withoutNormalizing(e, () => {
							// Remove the trailing empty listItem
							Transforms.removeNodes(e, { at: containingListItemPath })
							Transforms.insertNodes(e, e.createDefaultElement([{ text: '' }]), { at: containingListPath })
							Transforms.select(e, containingListPath)
						})
					}
				} else {
					// We're in the middle of a list.
					if (listParentEntry !== undefined) {
						// This is a nested list
						// TODO
					} else {
						// We're not in a nested list
						Editor.withoutNormalizing(e, () => {
							Transforms.removeNodes(e, { at: containingListItemPath })
							Transforms.splitNodes(e, { at: containingListItemPath })
							const afterListParent = SlatePath.next(containingListPath)
							Transforms.insertNodes(e, e.createDefaultElement([{ text: '' }]), { at: afterListParent })
							Transforms.select(e, afterListParent)
						})
					}
				}
			} else {
				// We're at the end of a list.

				if (listParentEntry !== undefined) {
					// We're in a nested list
					// TODO
				} else {
					// We're not in a nested list
					Editor.withoutNormalizing(e, () => {
						const afterListParent = SlatePath.next(containingListPath)
						// Remove the trailing empty listItem
						Transforms.removeNodes(e, { at: containingListItemPath })
						Transforms.insertNodes(e, e.createDefaultElement([{ text: '' }]), { at: afterListParent })
						Transforms.select(e, afterListParent)
					})
				}
			}
		},
	})

	return (editor as unknown) as EditorWithLists<E>
}
