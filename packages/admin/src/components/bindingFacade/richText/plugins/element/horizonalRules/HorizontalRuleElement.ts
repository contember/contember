import type { BaseEditor } from '../../../baseEditor'

export const horizontalRuleElementType = 'horizontalRule' as const

export interface HorizontalRuleElement {
	type: typeof horizontalRuleElementType
	children: BaseEditor['children']
}
