import * as React from 'react'
import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	Path as SlatePath,
	Range as SlateRange,
	Transforms,
} from 'slate'
import { BaseEditor, BlockElement } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import { EditorWithLists } from './EditorWithLists'
import { ListItemElement, listItemElementType } from './ListItemElement'
import { OrderedListElement, orderedListElementType } from './OrderedListElement'
import { indentListItem, dedentListItem } from './transforms'
import { UnorderedListElement, unorderedListElementType } from './UnorderedListElement'

export const withLists = <E extends BaseEditor>(editor: E): EditorWithLists<E> => {
	const {
		renderElement,
		insertBreak,
		deleteBackward,
		normalizeNode,
		isElementActive,
		toggleElement,
		onKeyDown,
	} = editor

	const e = (editor as any) as EditorWithLists<E>

	Object.assign<EditorWithLists<BaseEditor>, Partial<EditorWithLists<BaseEditor>>>(e, {
		isListItem: (element, suchThat): element is ListItemElement =>
			ContemberEditor.isElementType(element, listItemElementType, suchThat),
		isUnorderedList: (element, suchThat): element is UnorderedListElement =>
			ContemberEditor.isElementType(element, unorderedListElementType, suchThat),
		isOrderedList: (element, suchThat): element is OrderedListElement =>
			ContemberEditor.isElementType(element, orderedListElementType, suchThat),
		isList: (element, suchThat): element is OrderedListElement | UnorderedListElement =>
			e.isUnorderedList(element, suchThat) || e.isOrderedList(element, suchThat),

		renderElement: props => {
			switch (props.element.type) {
				case listItemElementType:
					return React.createElement(BlockElement, {
						element: props.element,
						attributes: props.attributes,
						domElement: 'li',
						children: props.children,
					})
				case unorderedListElementType:
					return React.createElement(BlockElement, {
						element: props.element,
						attributes: props.attributes,
						domElement: 'ul',
						children: props.children,
					})
				case orderedListElementType:
					return React.createElement(BlockElement, {
						element: props.element,
						attributes: props.attributes,
						domElement: 'ol',
						children: props.children,
					})
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
					Transforms.setNodes(e, { type: listItemElementType }, { at: path })
				}
				const emptyList: UnorderedListElement | OrderedListElement = {
					...suchThat,
					type: elementType as (UnorderedListElement | OrderedListElement)['type'],
					children: [],
				}
				Transforms.wrapNodes(e, emptyList)
			})
		},
		normalizeNode: entry => {
			const [node, path] = entry

			if (!SlateElement.isElement(node)) {
				return normalizeNode(entry)
			}
			if (e.isList(node)) {
				for (const [child, childPath] of SlateNode.children(e, path)) {
					if (SlateElement.isElement(child)) {
						if (child.type !== listItemElementType) {
							ContemberEditor.ejectElement(e, childPath)
							Transforms.setNodes(e, { type: listItemElementType }, { at: childPath })
						}
					} else {
						// If a list contains non-element nodes, just remove it.
						return Transforms.removeNodes(e, {
							at: path,
						})
					}
				}
			} else if (e.isListItem(node)) {
				const closestBlockEntry = ContemberEditor.closestBlockEntry(e, path)
				if (closestBlockEntry === undefined || !e.isList(closestBlockEntry[0])) {
					return Editor.withoutNormalizing(e, () => {
						const defaultElement = e.createDefaultElement([{ text: '' }])
						Transforms.wrapNodes(e, defaultElement, {
							at: path,
						})
						Transforms.unwrapNodes(e, {
							at: [...path, 0],
						})
					})
				}
				if (node.children.length === 1) {
					const onlyChild = node.children[0]
					if (SlateElement.isElement(onlyChild) && e.isDefaultElement(onlyChild)) {
						return Transforms.unwrapNodes(e, {
							at: [...path, 0],
						})
					}
				}
				const firstChild = node.children[0]
				if (SlateElement.isElement(firstChild) && e.isList(firstChild)) {
					return Transforms.insertNodes(e, e.createDefaultElement([{ text: '' }]), {
						at: [...path, 0],
					})
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

			const [, containingListItemPath] = closestListItemEntry

			const containingListPath = SlatePath.parent(containingListItemPath)
			const containingList = SlateNode.get(e, containingListPath)

			if (!e.isList(containingList)) {
				// This shouldn't really happen. It's more of a sanity check.
				return insertBreak()
			}

			const followingListItemPath = SlatePath.next(containingListItemPath)
			const hasFollowingListItem = SlateNode.has(e, followingListItemPath)

			if (hasFollowingListItem) {
				const followingListItemNode = SlateNode.get(e, followingListItemPath)
				if (!e.isListItem(followingListItemNode)) {
					// This shouldn't really happen. It's more of a sanity check.
					return insertBreak()
				}
				if (containingListItemPath[containingListItemPath.length - 1] === 0) {
					// We're at the beginning of a list
					Editor.withoutNormalizing(e, () => {
						// Remove the trailing empty listItem
						Transforms.removeNodes(e, { at: containingListItemPath })
						Transforms.insertNodes(e, e.createDefaultElement([{ text: '' }]), { at: containingListPath, select: true })
					})
				} else {
					// We're in the middle of a list.
					Editor.withoutNormalizing(e, () => {
						Transforms.removeNodes(e, { at: containingListItemPath })
						Transforms.splitNodes(e, { at: containingListItemPath })
						const afterListParent = SlatePath.next(containingListPath)
						Transforms.insertNodes(e, e.createDefaultElement([{ text: '' }]), { at: afterListParent, select: true })
					})
				}
			} else {
				// We're at the end of a list.
				Editor.withoutNormalizing(e, () => {
					const afterListParent = SlatePath.next(containingListPath)
					// Remove the trailing empty listItem
					Transforms.removeNodes(e, { at: containingListItemPath })
					Transforms.insertNodes(e, e.createDefaultElement([{ text: '' }]), { at: afterListParent, select: true })
				})
			}
		},
		onKeyDown: event => {
			// TODO this should also work for expanded selections
			if (event.key !== 'Tab' || !editor.selection || !SlateRange.isCollapsed(editor.selection)) {
				return onKeyDown(event)
			}
			const selection = editor.selection
			const closestBlockEntry = ContemberEditor.closestBlockEntry(e, selection.focus)

			if (closestBlockEntry === undefined) {
				return onKeyDown(event)
			}
			let [closestBlockElement, closestBlockPath] = closestBlockEntry
			if (e.isDefaultElement(closestBlockElement)) {
				;[closestBlockElement, closestBlockPath] = Editor.parent(e, closestBlockPath)
			}
			if (!e.isListItem(closestBlockElement)) {
				return onKeyDown(event)
			}
			const succeeded = event.shiftKey
				? dedentListItem(e, closestBlockElement, closestBlockPath)
				: indentListItem(e, closestBlockElement, closestBlockPath)

			if (succeeded) {
				return event.preventDefault()
			}
			return onKeyDown(event)
		},
	})

	return (editor as unknown) as EditorWithLists<E>
}
