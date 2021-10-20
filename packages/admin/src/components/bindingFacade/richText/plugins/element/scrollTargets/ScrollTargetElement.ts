import type { BaseEditor, ElementNode } from '../../../baseEditor'

export const scrollTargetElementType = 'scrollTarget' as const

export interface ScrollTargetElement extends ElementNode {
	type: typeof scrollTargetElementType
	identifier: string
	children: BaseEditor['children']
}
