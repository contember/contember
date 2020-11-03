import { Element, Node } from 'slate'

type BlockReferenceElementType = 'blockReference'
export const blockReferenceElementType: BlockReferenceElementType = 'blockReference'

export interface BlockReferenceElement extends Element {
	type: BlockReferenceElementType
	referenceId: string
}

export const isBlockReferenceElement = (node: Node): node is BlockReferenceElement =>
	Element.isElement(node) && node.type === blockReferenceElementType
