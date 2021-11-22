import type { DataGridColumns, DataGridOrderDirectionStore } from '../base'

export const normalizeInitialOrderBys = (value: DataGridOrderDirectionStore | undefined, columns: DataGridColumns): DataGridOrderDirectionStore => {
	if (value && Object.keys(value).length > 0) {
		return value
	}
	return Object.fromEntries(Array.from(columns.entries()).flatMap(([i, value]) => {
		if (value.enableOrdering !== false && value.initialOrder) {
			return [[i, value.initialOrder]]
		}
		return []
	}))
}
