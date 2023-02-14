import { DataGridColumns, DataGridHiddenColumnsStateStore } from '../types'

export const normalizeInitialHiddenColumnsState = (value: DataGridHiddenColumnsStateStore | undefined, columns: DataGridColumns<any>): DataGridHiddenColumnsStateStore => {
	return Object.fromEntries(Array.from(columns.entries(), ([i, col]) => [i, value?.[i] ?? col.hidden ?? false]))
}
