import { Element, Node } from 'slate'
import { ElementNode } from '../../baseEditor'

type ContemberFieldElementType = '__contember_field__'
export const contemberFieldElementType: ContemberFieldElementType = '__contember_field__'

export type ContemberFieldElementPosition = 'leading' //| 'trailing'

export interface ContemberFieldElement extends ElementNode {
	type: ContemberFieldElementType
	position: ContemberFieldElementPosition
	index: number
}

export const isContemberFieldElement = (node: Node): node is ContemberFieldElement =>
	Element.isElement(node) && node.type === contemberFieldElementType
