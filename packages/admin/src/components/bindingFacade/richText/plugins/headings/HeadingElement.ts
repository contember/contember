import { BaseEditor, ElementNode } from '../essentials'

export const headingElementType = 'heading' as const

export interface HeadingElement extends ElementNode {
	type: 'heading'
	level: 1 | 2
	children: BaseEditor['children']
}
