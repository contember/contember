import { BaseEditor, ElementNode } from '../essentials'

export interface ParagraphElement extends ElementNode {
	type: 'paragraph'
	children: BaseEditor['children']
}
