import type { DataGridColumns, DataGridHiddenColumnsStateStore } from '../base'

export const normalizeInitialHiddenColumnsState = (columns: DataGridColumns): DataGridHiddenColumnsStateStore => {
	const hideState: DataGridHiddenColumnsStateStore = new Set()

	for (const [i, value] of columns) {
		if (value.hidden) {
			hideState.add(i)
		}
	}

	return hideState
}
