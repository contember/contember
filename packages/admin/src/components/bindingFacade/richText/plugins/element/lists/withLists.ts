import { createElement } from 'react'
import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	NodeEntry,
	Path as SlatePath,
	Range as SlateRange,
	Text,
	Transforms,
} from 'slate'
import { BaseEditor, BlockElement, ElementNode, ElementSpecifics, NodesWithType } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import type { EditorWithLists } from './EditorWithLists'
import { ListItemElement, listItemElementType } from './ListItemElement'
import { OrderedListElement, orderedListElementType } from './OrderedListElement'
import { dedentListItem, indentListItem } from './transforms'
import { UnorderedListElement, unorderedListElementType } from './UnorderedListElement'

export const withLists = <E extends BaseEditor>(editor: E): EditorWithLists<E> => {
	const {
		canContainAnyBlocks,
		renderElement,
		insertBreak,
		deleteBackward,
		normalizeNode,
		isElementActive,
		toggleElement,
		onKeyDown,
		processBlockPaste,
		processNodeListPaste,
	} = editor

	const e = editor as any as EditorWithLists<E>

	Object.assign<EditorWithLists<BaseEditor>, Partial<EditorWithLists<BaseEditor>>>(e, {
		isListItem: (element, suchThat): element is ListItemElement =>
			ContemberEditor.isElementType(element, listItemElementType, suchThat),
		isUnorderedList: (element, suchThat): element is UnorderedListElement =>
			ContemberEditor.isElementType(element, unorderedListElementType, suchThat),
		isOrderedList: (element, suchThat): element is OrderedListElement =>
			ContemberEditor.isElementType(element, orderedListElementType, suchThat),
		isList: (element, suchThat): element is OrderedListElement | UnorderedListElement =>
			e.isUnorderedList(element, suchThat) || e.isOrderedList(element, suchThat),

		pastedHtmlOrderedListElementSpecifics: textContent => {
			return {}
		},

		renderElement: props => {
			switch (props.element.type) {
				case listItemElementType:
					return createElement(BlockElement, {
						element: props.element,
						attributes: props.attributes,
						domElement: 'li',
						children: props.children,
					})
				case unorderedListElementType:
					return createElement(BlockElement, {
						element: props.element,
						attributes: props.attributes,
						domElement: 'ul',
						children: props.children,
					})
				case orderedListElementType:
					return createElement(BlockElement, {
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
				case orderedListElementType: {
					const closestNonDefaultEntry = ContemberEditor.closest(editor, {
						match: node => Editor.isBlock(editor, node) && !editor.isDefaultElement(node),
					})
					if (!closestNonDefaultEntry) {
						return false
					}
					const [closestNonDefaultElement, closestNonDefaultPath] = closestNonDefaultEntry

					let parentList: ElementNode

					if (e.isListItem(closestNonDefaultElement)) {
						parentList = Editor.node(editor, SlatePath.parent(closestNonDefaultPath))[0] as ElementNode
					} else if (e.isList(closestNonDefaultElement)) {
						parentList = closestNonDefaultElement
					} else {
						return false
					}

					if (elementType === unorderedListElementType) {
						return e.isUnorderedList(parentList, suchThat)
					} else if (elementType === orderedListElementType) {
						return e.isOrderedList(parentList, suchThat)
					} else {
						return false
					}
				}
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

			if (e.isElementActive(elementType, suchThat)) {
				const closestListEntry = ContemberEditor.closest(editor, {
					match: node => SlateElement.isElement(node) && node.type === elementType,
				}) as NodeEntry<UnorderedListElement | OrderedListElement>
				if (!closestListEntry) {
					return
				}
				return Editor.withoutNormalizing(editor, () => {
					const [closestList, closestListPath] = closestListEntry

					// It's important that we iterate backwards because otherwise we'd mangle the paths.
					// We unwrap elements which may have more than one child.
					for (let i = closestList.children.length - 1; i >= 0; i--) {
						const currentItemPath = [...closestListPath, i]
						if (Editor.hasInlines(editor, closestList.children[i] as ElementNode)) {
							Transforms.wrapNodes(editor, editor.createDefaultElement([]), {
								at: currentItemPath,
							})
							Transforms.unwrapNodes(editor, {
								at: [...currentItemPath, 0],
							})
						} else {
							Transforms.unwrapNodes(editor, { at: currentItemPath })
						}
					}
					Transforms.unwrapNodes(editor, { at: closestListPath })
				})
			}
			if (e.isElementActive(elementType) || e.isElementActive(otherKindOfList)) {
				// We're in a list but a different one. Note the lack of 'suchThat'
				const closestListEntry = ContemberEditor.closest(editor, {
					match: node => e.isList(node),
				}) as NodeEntry<UnorderedListElement | OrderedListElement>
				if (!closestListEntry) {
					return
				}
				return Editor.withoutNormalizing(editor, () => {
					const [, closestListPath] = closestListEntry
					ContemberEditor.ejectElement(editor, closestListPath)
					Transforms.setNodes(editor, { ...suchThat, type: elementType }, { at: closestListPath })
				})
			}

			const selection = editor.selection

			if (!selection) {
				return
			}

			const closestViableParentEntry = ContemberEditor.closestViableBlockContainerEntry(editor)

			if (!closestViableParentEntry) {
				return
			}

			Editor.withoutNormalizing(e, () => {
				const [targetParent, targetParentPath] = closestViableParentEntry

				if (Editor.hasInlines(editor, targetParent)) {
					// We're deliberately widening the selection to include all the inlines.
					const listItemPath = [...targetParentPath, 0]

					// Not using wrapNodes because it appears to exhibit rather unpredictable treatment of text nodes.
					Transforms.insertNodes(editor, { type: listItemElementType, children: [] }, { at: listItemPath })
					Transforms.moveNodes(editor, {
						to: [...listItemPath, 0],
						match: node => Text.isText(node) || Editor.isInline(editor, node),
						at: {
							anchor: Editor.start(editor, [...targetParentPath, 1]),
							focus: Editor.end(editor, [...targetParentPath, targetParent.children.length]),
						},
					})
					Transforms.wrapNodes(editor, { type: elementType, children: [] }, { at: listItemPath })
				} else {
					const [selectionStart, selectionEnd] = Editor.edges(editor, selection)
					const relativeStartIndex = selectionStart.path[targetParentPath.length]
					const relativeEndIndex = selectionEnd.path[targetParentPath.length]

					for (let i = relativeStartIndex; i <= relativeEndIndex; i++) {
						Transforms.wrapNodes(editor, { type: listItemElementType, children: [] }, { at: [...targetParentPath, i] })
					}

					const emptyList: UnorderedListElement | OrderedListElement = {
						...suchThat,
						type: elementType as (UnorderedListElement | OrderedListElement)['type'],
						children: [],
					}
					const listPath = [...targetParentPath, relativeStartIndex]
					Transforms.insertNodes(editor, emptyList, { at: listPath })

					for (let i = relativeStartIndex; i <= relativeEndIndex; i++) {
						Transforms.moveNodes(editor, {
							to: [...listPath, i - relativeStartIndex],
							// The path doesn't depend on i because we keep moving the siblings away.
							at: [...targetParentPath, relativeStartIndex + 1],
						})
					}
				}
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
				const parentEntry = Editor.above(editor, { at: path })
				if (parentEntry === undefined || !e.isList(parentEntry[0])) {
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
			const closestBlockEntry = ContemberEditor.closestBlockEntry(e)
			if (closestBlockEntry === undefined) {
				return insertBreak()
			}
			const [closestBlock, closestBlockPath] = closestBlockEntry

			let containingListItem: ListItemElement
			let containingListItemPath: SlatePath

			if (!e.isListItem(closestBlock)) {
				if (closestBlockPath.length < 2) {
					// This block cannot be inside a list
					return insertBreak()
				}

				containingListItemPath = SlatePath.parent(closestBlockPath)
				const closestListItem = SlateNode.get(e, containingListItemPath)

				if (!e.isListItem(closestListItem)) {
					// The block is not inside a list
					return insertBreak()
				}
				containingListItem = closestListItem
			} else {
				containingListItem = closestBlock
				containingListItemPath = closestBlockPath
			}

			if (SlateNode.string(containingListItem) !== '') {
				return Transforms.splitNodes(e, {
					always: true,
					at: selection.focus,
					match: node => e.isListItem(node),
				})
			}

			// We're in a list and want to leave this list.

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
			if (
				(event.key !== 'Tab' && event.key !== 'Enter') ||
				!editor.selection ||
				!SlateRange.isCollapsed(editor.selection)
			) {
				return onKeyDown(event)
			}
			const selection = editor.selection
			const closestBlockEntry = ContemberEditor.closestBlockEntry(e, { at: selection.focus })

			if (closestBlockEntry === undefined) {
				return onKeyDown(event)
			}
			let [closestBlockElement, closestBlockPath] = closestBlockEntry

			if (event.key === 'Tab') {
				if (e.isDefaultElement(closestBlockElement)) {
					[closestBlockElement, closestBlockPath] = Editor.parent(e, closestBlockPath)
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
			} else if (event.key === 'Enter' && event.shiftKey) {
				if (e.isDefaultElement(closestBlockElement)) {
					const [listItem] = Editor.parent(e, closestBlockPath)
					if (!e.isListItem(listItem)) {
						return onKeyDown(event)
					}
					event.preventDefault()
					return Transforms.splitNodes(e, {
						always: true,
						at: selection.focus,
						match: node => Editor.isBlock(e, node) && e.isDefaultElement(node),
					})
				} else if (e.isListItem(closestBlockElement)) {
					// We want to create a newline but the closest block is the list item.
					// This should mean that it only contains inlines. Hence we wrap them in a default element
					// and then split it.
					const [listItemStart, listItemEnd] = Editor.edges(editor, closestBlockPath)
					event.preventDefault()
					return Editor.withoutNormalizing(e, () => {
						Transforms.wrapNodes(e, e.createDefaultElement([]), {
							match: node => Text.isText(node) || e.isInline(node),
							at: {
								anchor: listItemStart,
								focus: listItemEnd,
							},
						})
						const relative = SlatePath.relative(selection.focus.path, closestBlockPath)
						Transforms.splitNodes(e, {
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
		canContainAnyBlocks: element => {
			switch (element.type) {
				case unorderedListElementType:
				case orderedListElementType:
					return false
				case listItemElementType:
					return true
				default:
					return canContainAnyBlocks(element)
			}
		},
	})

	editor.processBlockPaste = (element, next, cumulativeTextAttrs) => {
		if (element.tagName === 'UL') {
			return [{ type: unorderedListElementType, children: next(element.childNodes, cumulativeTextAttrs) }]
		}
		if (element.tagName === 'OL') {
			return [{ type: orderedListElementType, children: next(element.childNodes, cumulativeTextAttrs) }]
		}
		if (element.tagName === 'LI') {
			return [{ type: listItemElementType, children: next(element.childNodes, cumulativeTextAttrs) }]
		}
		return processBlockPaste(element, next, cumulativeTextAttrs)
	}

	// Word list handling
	editor.processNodeListPaste = (nodeList, cumulativeTextAttrs) => {
		const result: NodesWithType[] = []
		let group: Node[] = []
		let groupWasList = false
		let currentListSpecifics: boolean | ElementSpecifics<OrderedListElement> = false
		let includesList = false
		let lastListId: string | null = null

		const processGroup = (): NodesWithType => {
			if (groupWasList) {
				return {
					elements: [
						{
							type: currentListSpecifics === false ? unorderedListElementType : orderedListElementType,
							...(typeof currentListSpecifics === 'boolean' ? {} : currentListSpecifics),
							children: group.map(item => {
								return {
									type: listItemElementType,
									children: editor.deserializeFromNodeListToPure(
										editor.wordPasteListItemContent(item.childNodes),
										cumulativeTextAttrs,
									),
								}
							}),
						} as ElementNode,
					],
				}
			} else {
				return editor.processNodeListPaste(group, cumulativeTextAttrs)
			}
		}

		for (let i = 0; i < nodeList.length; i++) {
			const curr = nodeList[i]
			const isWhiteSpace = curr.nodeType === Node.TEXT_NODE && curr.textContent?.match(/^\s*$/) !== null
			if (groupWasList && isWhiteSpace) {
				continue
			}
			let isList = false
			let listId: string | null = null
			if (curr instanceof HTMLElement && curr.nodeName === 'P') {
				const match = curr.getAttribute('style')?.match(/mso-list:(\w+ level\d+ \w+)/) ?? null
				if (match !== null) {
					isList = true
					listId = match[1]

					if (!groupWasList || lastListId === listId) {
						const textContent = (curr as HTMLElement).textContent!
						const firstChar = isList ? textContent[0] : ' '
						currentListSpecifics = isList
							? firstChar === 'o'
								? currentListSpecifics
								: firstChar.match(/^\w$/) !== null
								? e.pastedHtmlOrderedListElementSpecifics(textContent)
								: false
							: false
					}
				}
			}

			if (isList !== groupWasList || listId !== lastListId) {
				includesList = true
				if (group.length > 0) {
					result.push(processGroup())
					group = []
				}
			}
			groupWasList = isList
			lastListId = listId
			group.push(curr)
		}

		if (includesList) {
			result.push(processGroup())
			return editor.flattenNodesWithType(result)
		} else {
			return processNodeListPaste(nodeList, cumulativeTextAttrs)
		}
	}

	return editor as unknown as EditorWithLists<E>
}
