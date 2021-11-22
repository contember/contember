import type { DataGridColumns, DataGridFilterArtifactStore } from '../base'

export const normalizeInitialFilters = (columns: DataGridColumns): DataGridFilterArtifactStore => {
	return Object.fromEntries(Object.entries(columns).flatMap(([i, value]) => {
		if (value.enableFiltering !== false && value.initialFilter !== undefined) {
			return [[i, value.initialFilter]]
		}
		return []
	}))
}
