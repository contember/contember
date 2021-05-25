import type { DataGridColumns, DataGridFilterArtifactStore } from '../base'

export const normalizeInitialFilters = (columns: DataGridColumns): DataGridFilterArtifactStore => {
	const filters: DataGridFilterArtifactStore = new Map()

	for (const [i, value] of columns) {
		if (value.enableFiltering !== false && value.initialFilter !== undefined) {
			filters.set(i, value.initialFilter)
		}
	}

	return filters
}
