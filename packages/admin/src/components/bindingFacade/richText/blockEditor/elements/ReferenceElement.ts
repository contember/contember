import { Element, Node } from 'slate'
import type { ElementWithReference } from './ElementWithReference'

type ReferenceElementType = 'reference'
export const referenceElementType: ReferenceElementType = 'reference'

export interface ReferenceElement extends ElementWithReference {
	type: ReferenceElementType
}

export const isReferenceElement = (node: Node): node is ReferenceElement =>
	Element.isElement(node) && node.type === referenceElementType
