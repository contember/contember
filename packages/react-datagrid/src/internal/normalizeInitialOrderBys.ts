import { DataGridColumns, DataGridOrderDirectionStore } from '../types'

export const normalizeInitialOrderBys = (value: DataGridOrderDirectionStore | undefined, columns: DataGridColumns<any>): DataGridOrderDirectionStore => {
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
