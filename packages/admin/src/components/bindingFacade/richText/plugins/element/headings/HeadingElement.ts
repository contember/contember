import { BaseEditor, ElementNode } from '../../../baseEditor'

export const headingElementType = 'heading' as const

export interface HeadingElement extends ElementNode {
	type: typeof headingElementType
	level: 1 | 2 | 3 | 4 | 5 | 6
	isNumbered?: boolean
	children: BaseEditor['children']
}
