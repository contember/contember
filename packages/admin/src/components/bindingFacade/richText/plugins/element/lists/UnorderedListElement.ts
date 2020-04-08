import { BaseEditor, ElementNode } from '../../../baseEditor'

export const unorderedListElementType = 'unorderedList' as const

export interface UnorderedListElement extends ElementNode {
	type: typeof unorderedListElementType
	children: BaseEditor['children']
}
