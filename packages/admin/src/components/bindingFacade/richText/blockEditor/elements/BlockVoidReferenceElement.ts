import { Element, Node } from 'slate'

type BlockVoidReferenceElementType = 'blockVoidReference'
export const blockVoidReferenceElementType: BlockVoidReferenceElementType = 'blockVoidReference'

export interface BlockVoidReferenceElement extends Element {
	type: BlockVoidReferenceElementType
	referenceId: string
}

export const isBlockVoidReferenceElement = (node: Node): node is BlockVoidReferenceElement =>
	Element.isElement(node) && node.type === blockVoidReferenceElementType
