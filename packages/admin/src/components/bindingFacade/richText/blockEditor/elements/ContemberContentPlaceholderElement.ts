import { Element, Node } from 'slate'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'

type ContemberContentPlaceholderType = '__contember_contentPlaceholder__'
export const contemberContentPlaceholderType: ContemberContentPlaceholderType = '__contember_contentPlaceholder__'

export interface ContemberContentPlaceholderElement extends Element {
	type: ContemberContentPlaceholderType
	// Normally, it would be a problem that this won't necessarily JSON.stringify but this element is to be
	// only ever used in runtime.
	placeholder: ReactNode
}

export const isContemberContentPlaceholderElement = (node: Node): node is ContemberContentPlaceholderElement =>
	Element.isElement(node) && node.type === contemberContentPlaceholderType
