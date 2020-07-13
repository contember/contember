import { BaseEditor } from '../../../baseEditor'

export const scrollTargetElementType = 'scrollTarget' as const

export interface ScrollTargetElement {
	type: typeof scrollTargetElementType
	identifier: string
	children: BaseEditor['children']
}
