import { BaseEditor } from '../../essentials'

export const anchorElementType = 'anchor' as const

export interface AnchorElement {
	type: typeof anchorElementType
	href: string
	children: BaseEditor['children']
}
