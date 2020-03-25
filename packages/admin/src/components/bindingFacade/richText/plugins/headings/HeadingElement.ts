import { BaseEditor, ElementNode } from '../essentials'

export const headingElementType = 'heading' as const

export interface HeadingElement extends ElementNode {
	type: typeof headingElementType
	level: 1 | 2
	isNumbered?: boolean
	children: BaseEditor['children']
}
