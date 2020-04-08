import { Node as SlateNode } from 'slate'
import { BaseEditor, ElementNode, ElementSpecifics, WithAnotherNodeType } from '../../../baseEditor'
import { ListItemElement } from './ListItemElement'
import { OrderedListElement } from './OrderedListElement'
import { UnorderedListElement } from './UnorderedListElement'

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
	isListItem: (
		element: ElementNode | SlateNode,
		suchThat?: ElementSpecifics<ListItemElement>,
	) => element is ListItemElement
}

export type EditorWithLists<E extends BaseEditor> = WithAnotherNodeType<
	E,
	UnorderedListElement | OrderedListElement | ListItemElement
> &
	WithLists<WithAnotherNodeType<E, UnorderedListElement | OrderedListElement | ListItemElement>>
