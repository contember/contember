import { Element, Node } from 'slate'

type ContemberContentPlaceholderType = '__contember_contentPlaceholder__'
export const contemberContentPlaceholderType: ContemberContentPlaceholderType = '__contember_contentPlaceholder__'

export interface ContemberContentPlaceholder extends Element {
	type: ContemberContentPlaceholderType
}

export const isContemberContentPlaceholder = (node: Node): node is ContemberContentPlaceholder =>
	Element.isElement(node) && node.type === contemberContentPlaceholderType
