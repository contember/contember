import { DataGridColumnProps, DataGridColumns } from '../types'

export const getFilterTypes = (columns: DataGridColumns<any>) => {
	return Object.fromEntries(Array.from(columns.entries()).flatMap(([i, value]: [string, DataGridColumnProps<any>]) => {
		if (value.enableFiltering === false) {
			return []
		}
		return [[i, value.getNewFilter]]
	}))
}
