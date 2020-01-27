import { ArrayContents, BaseEditor, TextNode } from '../essentials'

export interface AnchorElement {
	type: 'anchor'
	href: string
	children: Array<ArrayContents<BaseEditor['children']> | AnchorElement | TextNode>
}
