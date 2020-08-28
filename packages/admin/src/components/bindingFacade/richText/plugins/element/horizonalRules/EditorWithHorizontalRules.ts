import { BaseEditor, ElementNode, WithAnotherNodeType } from '../../../baseEditor'
import { HorizontalRuleElement } from './HorizontalRuleElement'

export interface WithHorizontalRules<E extends WithAnotherNodeType<BaseEditor, HorizontalRuleElement>> {
	isHorizontalRule: (element: ElementNode) => element is HorizontalRuleElement
}

export type EditorWithHorizontalRules<E extends BaseEditor> = WithAnotherNodeType<E, HorizontalRuleElement> &
	WithHorizontalRules<WithAnotherNodeType<E, HorizontalRuleElement>>
