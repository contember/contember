import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../../baseEditor'
import { AnchorElement } from './AnchorElement'

export interface WithAnchors<E extends WithAnotherNodeType<BaseEditor, AnchorElement>> {
	isAnchor: (element: ElementNode) => element is AnchorElement
}

export type EditorWithAnchors<E extends BaseEditor> = WithAnotherNodeType<E, AnchorElement> &
	WithAnchors<WithAnotherNodeType<E, AnchorElement>>
