import type { BaseEditor, ElementNode, WithAnotherNodeType } from '../../../baseEditor'
import type { ScrollTargetElement } from './ScrollTargetElement'

export interface WithScrollTargets<E extends WithAnotherNodeType<BaseEditor, ScrollTargetElement>> {
	isScrollTarget: (element: ElementNode) => element is ScrollTargetElement
}

export type EditorWithScrollTargets<E extends BaseEditor> = WithAnotherNodeType<E, ScrollTargetElement> &
	WithScrollTargets<WithAnotherNodeType<E, ScrollTargetElement>>
