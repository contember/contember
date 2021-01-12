import { DataGridColumns, DataGridFilters } from '../base'

export const normalizeInitialFilters = (columns: DataGridColumns): DataGridFilters => {
	const filters: DataGridFilters = new Map()

	for (const [i, value] of columns) {
		if (value.enableFiltering !== false && value.initialFilter) {
			filters.set(i, value.initialFilter)
		}
	}

	return filters
}
