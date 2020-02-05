import * as React from 'react'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../essentials'
import { AnchorElement } from './AnchorElement'
import { AnchorRendererProps } from './AnchorRenderer'

export interface WithAnchors<E extends WithAnotherNodeType<BaseEditor, AnchorElement>> {
	isAnchor: (element: ElementNode) => element is AnchorElement
	isAnchorActive: (editor: E) => boolean
	wrapAnchor: (editor: E, url: string) => void
	unwrapAnchor: (editor: E) => void
	anchorRenderer: React.FunctionComponent<AnchorRendererProps>
}

export type EditorWithAnchors<E extends BaseEditor> = WithAnotherNodeType<E, AnchorElement> &
	WithAnchors<WithAnotherNodeType<E, AnchorElement>>
