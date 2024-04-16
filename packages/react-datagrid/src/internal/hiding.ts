import { DataGridColumns } from '../types'
import { DataViewSelectionState } from '@contember/react-dataview'


export const normalizeInitialHiddenColumnsState = (value: DataViewSelectionState, columns: DataGridColumns<any>): DataViewSelectionState['visibility'] => {
	return Object.fromEntries(Array.from(columns.entries(), ([i, col]) => [i, value?.visibility?.[i] ?? !(col.hidden ?? false)]))
}
