import type { Environment, Filter } from '@contember/react-binding'
import { DataGridColumns, DataGridFilterArtifactStore, getColumnFilter } from '../base'

export const collectFilters = (
	columns: DataGridColumns,
	filters: DataGridFilterArtifactStore,
	environment: Environment,
): Filter[] => {
	return Object.entries(filters).flatMap(([key, artifact]) => {
		const column = columns.get(key)
		if (column === undefined) {
			return []
		}
		const filter = getColumnFilter(column, artifact, environment)
		return filter !== undefined ? [filter] : []
	})
}
