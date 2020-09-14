import { BaseEditor, ElementNode } from '../../../baseEditor'

export const tableCellElementType = 'tableCell' as const

export interface TableCellElement extends ElementNode {
	type: typeof tableCellElementType
	children: BaseEditor['children']
}
