import type { ElementToolbarButton } from '../../../toolbars'
import { TableElement, tableElementType } from './TableElement'

export const tableToolbarButton: ElementToolbarButton<TableElement> = {
	elementType: tableElementType,
	contemberIcon: 'table',
	label: 'Table',
	title: 'Table',
}
