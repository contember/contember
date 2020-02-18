import { FieldValue } from '@contember/binding'
import { Element, Node } from 'slate'

type ContemberBlockElementType = '__contember_block__'
export const contemberBlockElementType: ContemberBlockElementType = '__contember_block__'

export interface ContemberBlockElement extends Element {
	type: ContemberBlockElementType
	blockType: FieldValue
	entityKey: string
}

export const isContemberBlockElement = (node: Node): node is ContemberBlockElement =>
	Element.isElement(node) && node.type === contemberBlockElementType
