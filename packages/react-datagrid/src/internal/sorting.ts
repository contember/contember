import { DataGridColumns } from '../types'
import { DataViewSortingDirections } from '@contember/react-dataview'

export const getInitialSorting = (columns: DataGridColumns<any>): DataViewSortingDirections => {
	return Object.fromEntries(Array.from(columns.entries()).flatMap(([i, value]) => {
		if (value.enableOrdering !== false && value.initialOrder) {
			return [[i, value.initialOrder]]
		}
		return []
	}))
}
