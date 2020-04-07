import { Element, Node } from 'slate'

type ContemberFieldElementType = '__contember_field__'
export const contemberFieldElementType: ContemberFieldElementType = '__contember_field__'

export type ContemberFieldElementPosition = 'leading' //| 'trailing'

export interface ContemberFieldElement extends Element {
	type: ContemberFieldElementType
	position: ContemberFieldElementPosition
	index: number
}

export const isContemberFieldElement = (node: Node): node is ContemberFieldElement =>
	Element.isElement(node) && node.type === contemberFieldElementType
