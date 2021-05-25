import type { BaseEditor, ElementNode } from '../../../baseEditor'

export const listItemElementType = 'listItem' as const

export interface ListItemElement extends ElementNode {
	type: typeof listItemElementType
	children: BaseEditor['children']
}
