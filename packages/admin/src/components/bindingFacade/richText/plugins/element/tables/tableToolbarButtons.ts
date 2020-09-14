import { ElementToolbarButton } from '../../../toolbars'
import { TableElement, tableElementType } from './TableElement'

export const tableToolbarButton: ElementToolbarButton<TableElement> = {
	elementType: tableElementType,
	blueprintIcon: 'th',
	label: 'Table',
	title: 'Table',
}
