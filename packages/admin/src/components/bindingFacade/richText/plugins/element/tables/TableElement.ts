import type { BaseEditor, ElementNode } from '../../../baseEditor'

export const tableElementType = 'table' as const

export interface TableElement extends ElementNode {
	type: typeof tableElementType
	children: BaseEditor['children']
}
