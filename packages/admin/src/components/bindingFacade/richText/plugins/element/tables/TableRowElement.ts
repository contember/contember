import { BaseEditor, ElementNode } from '../../../baseEditor'

export const tableRowElementType = 'tableRow' as const

export interface TableRowElement extends ElementNode {
	type: typeof tableRowElementType
	children: BaseEditor['children']
}
