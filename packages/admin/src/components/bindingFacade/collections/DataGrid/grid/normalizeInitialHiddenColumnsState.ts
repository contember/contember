import type { DataGridColumns, DataGridHiddenColumnsStateStore } from '../base'

export const normalizeInitialHiddenColumnsState = (value: DataGridHiddenColumnsStateStore | undefined, columns: DataGridColumns): DataGridHiddenColumnsStateStore => {
	return Object.fromEntries(Array.from(columns.entries(), ([i, col]) => [i, value?.[i] ?? col.hidden ?? false]))
}
