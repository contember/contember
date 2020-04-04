import { BaseEditor, ElementNode } from '../../essentials'

export const paragraphElementType = 'paragraph' as const

export interface ParagraphElement extends ElementNode {
	type: typeof paragraphElementType
	children: BaseEditor['children']
}
