import * as React from 'react'
import { Editor, Element as SlateElement, Transforms } from 'slate'
import { BaseEditor } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import { EditorWithLists } from './EditorWithLists'
import { ListItemElement, listItemElementType } from './ListItemElement'
import { OrderedListElement, orderedListElementType } from './OrderedListElement'
import { UnorderedListElement, unorderedListElementType } from './UnorderedListElement'

export const withLists = <E extends BaseEditor>(editor: E): EditorWithLists<E> => {
	const { renderElement, insertBreak, deleteBackward, isElementActive, toggleElement } = editor

	const e = (editor as any) as EditorWithLists<E>

	Object.assign<EditorWithLists<BaseEditor>, Partial<EditorWithLists<BaseEditor>>>(e, {
		isListItem: (element, suchThat): element is ListItemElement => element.type === listItemElementType,
		isUnorderedList: (element, suchThat): element is UnorderedListElement => element.type === unorderedListElementType,
		isOrderedList: (element, suchThat): element is OrderedListElement => element.type === orderedListElementType,

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
			const otherKindOfList =
				elementType === orderedListElementType ? unorderedListElementType : unorderedListElementType

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
	})

	return (editor as unknown) as EditorWithLists<E>
}
