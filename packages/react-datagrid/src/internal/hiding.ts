import { DataGridColumns } from '../types'
import { DataViewSelectionValues } from '@contember/react-dataview'


export const normalizeInitialHiddenColumnsState = (value: DataViewSelectionValues, columns: DataGridColumns<any>): DataViewSelectionValues['visibility'] => {
	return Object.fromEntries(Array.from(columns.entries(), ([i, col]) => [i, value?.visibility?.[i] ?? !(col.hidden ?? false)]))
}
