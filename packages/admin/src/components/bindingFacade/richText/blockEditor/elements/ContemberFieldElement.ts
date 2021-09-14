import { Element, Node } from 'slate'

type ContemberFieldElementType = '__contember_field__'
export const contemberFieldElementType: ContemberFieldElementType = '__contember_field__'

export interface ContemberFieldElement extends Element {
	type: ContemberFieldElementType
}

export const isContemberFieldElement = (node: Node): node is ContemberFieldElement =>
	Element.isElement(node) && node.type === contemberFieldElementType
