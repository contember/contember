import type { ElementToolbarButton } from '../../../toolbars'
import { OrderedListElement, orderedListElementType } from './OrderedListElement'
import { UnorderedListElement, unorderedListElementType } from './UnorderedListElement'

export const unorderedListToolbarButton: ElementToolbarButton<UnorderedListElement> = {
	elementType: unorderedListElementType,
	blueprintIcon: 'properties',
	label: 'Bullet list',
	title: 'Bullet list',
}

export const orderedListToolbarButton: ElementToolbarButton<OrderedListElement> = {
	elementType: orderedListElementType,
	blueprintIcon: 'numbered-list',
	label: 'Numbered list',
	title: 'Numbered list',
}
