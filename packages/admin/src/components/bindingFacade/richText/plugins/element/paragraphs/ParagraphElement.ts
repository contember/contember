import { BaseEditor, ElementNode } from '../../../baseEditor'

export const paragraphElementType = 'paragraph' as const

export interface ParagraphElement extends ElementNode {
	type: typeof paragraphElementType
	isNumbered?: boolean
	children: BaseEditor['children']
}
