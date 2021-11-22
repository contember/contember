import type { DataGridColumns, DataGridFilterArtifactStore } from '../base'

export const normalizeInitialFilters = (storedValue: DataGridFilterArtifactStore | undefined, columns: DataGridColumns): DataGridFilterArtifactStore => {
	return Object.fromEntries(Array.from(columns.entries()).flatMap(([i, value]) => {
		if (value.enableFiltering === false) {
			return []
		}
		if (storedValue && storedValue[i]) {
			return [[i, storedValue[i]]]
		}
		if (value.initialFilter !== undefined) {
			return [[i, value.initialFilter]]
		}
		return []
	}))
}
