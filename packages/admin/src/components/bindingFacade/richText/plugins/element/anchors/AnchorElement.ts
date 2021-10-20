import type { BaseEditor } from '../../../baseEditor'
import { ElementNode } from '../../../baseEditor'

export const anchorElementType = 'anchor' as const

export interface AnchorElement extends ElementNode {
	type: typeof anchorElementType
	href: string
	children: BaseEditor['children']
}
