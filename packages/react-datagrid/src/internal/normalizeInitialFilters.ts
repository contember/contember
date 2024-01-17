import { DataGridColumns } from '../types'
import { DataViewFilteringArtifacts } from '@contember/react-dataview'

export const normalizeInitialFilters = (storedValue: DataViewFilteringArtifacts, columns: DataGridColumns<any>): DataViewFilteringArtifacts => {
	return Object.fromEntries(Array.from(columns.entries()).flatMap(([i, value]) => {
		if (value.enableFiltering === false) {
			return []
		}
		if (storedValue[i]) {
			return [[i, storedValue[i]]]
		}
		if (value.initialFilter !== undefined) {
			return [[i, value.initialFilter]]
		}
		return []
	}))
}
