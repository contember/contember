import { ArrayContents, BaseEditor, ElementNode, TextNode } from '../essentials'

export interface ParagraphElement extends ElementNode {
	type: 'paragraph'
	children: Array<ArrayContents<BaseEditor['children']> | ParagraphElement | TextNode>
}
