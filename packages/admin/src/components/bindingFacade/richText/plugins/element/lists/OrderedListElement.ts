import { BaseEditor, ElementNode } from '../../../baseEditor'

export const orderedListElementType = 'orderedList' as const

export interface OrderedListElement extends ElementNode {
	type: typeof orderedListElementType
	children: BaseEditor['children']
}
