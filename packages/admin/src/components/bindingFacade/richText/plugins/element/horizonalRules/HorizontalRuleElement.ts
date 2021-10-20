import type { BaseEditor, ElementNode } from '../../../baseEditor'

export const horizontalRuleElementType = 'horizontalRule' as const

export interface HorizontalRuleElement extends ElementNode {
	type: typeof horizontalRuleElementType
	children: BaseEditor['children']
}
