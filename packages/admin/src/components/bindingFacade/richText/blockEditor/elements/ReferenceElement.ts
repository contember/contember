import { Element, Node } from 'slate'

type ReferenceElementType = 'reference'
export const referenceElementType: ReferenceElementType = 'reference'

export interface ReferenceElement extends Element {
	type: ReferenceElementType
	referenceId: string
}

export const isReferenceElement = (node: Node): node is ReferenceElement =>
	Element.isElement(node) && node.type === referenceElementType
