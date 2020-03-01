import { FieldValue } from '@contember/binding'
import { Element, Node } from 'slate'

type ContemberBlockElementType = '__contember_block__'
export const contemberBlockElementType: ContemberBlockElementType = '__contember_block__'

export interface ContemberBlockElement extends Element {
	type: ContemberBlockElementType
	blockType: FieldValue
	entityKey: string // TODO this could probably be feasibly replaced by an index of the entities array
}

export const isContemberBlockElement = (node: Node): node is ContemberBlockElement =>
	Element.isElement(node) && node.type === contemberBlockElementType
