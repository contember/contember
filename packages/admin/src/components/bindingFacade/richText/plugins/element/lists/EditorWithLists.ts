import type { Node as SlateNode } from 'slate'
import type { BaseEditor, ElementNode, ElementSpecifics, WithAnotherNodeType } from '../../../baseEditor'
import type { ListItemElement } from './ListItemElement'
import type { OrderedListElement } from './OrderedListElement'
import type { UnorderedListElement } from './UnorderedListElement'

export interface WithLists<
	E extends WithAnotherNodeType<BaseEditor, UnorderedListElement | OrderedListElement | ListItemElement>
> {
	isUnorderedList: (
		element: ElementNode | SlateNode,
		suchThat?: ElementSpecifics<UnorderedListElement>,
	) => element is UnorderedListElement
	isOrderedList: (
		element: ElementNode | SlateNode,
		suchThat?: ElementSpecifics<OrderedListElement>,
	) => element is OrderedListElement
	isList: (
		element: ElementNode | SlateNode,
		suchThat?: ElementSpecifics<UnorderedListElement | OrderedListElement>,
	) => element is UnorderedListElement | OrderedListElement
	isListItem: (
		element: ElementNode | SlateNode,
		suchThat?: ElementSpecifics<ListItemElement>,
	) => element is ListItemElement

	pastedHtmlOrderedListElementSpecifics: (textContent: string) => ElementSpecifics<OrderedListElement>
}

export type EditorWithLists<E extends BaseEditor> = WithAnotherNodeType<
	E,
	UnorderedListElement | OrderedListElement | ListItemElement
> &
	WithLists<WithAnotherNodeType<E, UnorderedListElement | OrderedListElement | ListItemElement>>
