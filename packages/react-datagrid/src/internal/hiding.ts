import { DataGridColumns, DataGridHidingState } from '../types'
import { DataViewSelectionValues } from '@contember/react-dataview'

export const HiddenColumnPrefix = 'hidden_'
export const getHidingKey = (column: string) => `${HiddenColumnPrefix}${column}`

export const normalizeInitialHiddenColumnsState = (value: DataViewSelectionValues, columns: DataGridColumns<any>): DataGridHidingState => {
	return Object.fromEntries(Array.from(columns.entries(), ([i, col]) => [getHidingKey(i), value?.[getHidingKey(i)] ?? col.hidden ?? false]))
}
