import { Element, Node } from 'slate'
import * as React from 'react'

type ContemberContentPlaceholderType = '__contember_contentPlaceholder__'
export const contemberContentPlaceholderType: ContemberContentPlaceholderType = '__contember_contentPlaceholder__'

export interface ContemberContentPlaceholderElement extends Element {
	type: ContemberContentPlaceholderType
	// Normally, it would be a problem that this won't necessarily JSON.stringify but this element is to be
	// only ever used in runtime.
	placeholder: React.ReactNode
}

export const isContemberContentPlaceholderElement = (node: Node): node is ContemberContentPlaceholderElement =>
	Element.isElement(node) && node.type === contemberContentPlaceholderType
