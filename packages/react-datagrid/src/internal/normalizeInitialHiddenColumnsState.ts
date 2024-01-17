import { DataGridColumns, DataGridHidingState } from '../types'

export const normalizeInitialHiddenColumnsState = (value: DataGridHidingState | undefined, columns: DataGridColumns<any>): DataGridHidingState => {
	return Object.fromEntries(Array.from(columns.entries(), ([i, col]) => [i, value?.[i] ?? col.hidden ?? false]))
}
