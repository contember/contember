import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../../baseEditor'
import { AnchorElement } from './AnchorElement'

export interface WithAnchors<E extends WithAnotherNodeType<BaseEditor, AnchorElement>> {
	isAnchor: (element: ElementNode) => element is AnchorElement
	isAnchorActive: (editor: E) => boolean
	wrapAnchor: (editor: E, url: string) => void
	unwrapAnchor: (editor: E) => void
}

export type EditorWithAnchors<E extends BaseEditor> = WithAnotherNodeType<E, AnchorElement> &
	WithAnchors<WithAnotherNodeType<E, AnchorElement>>
