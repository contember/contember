import type { Environment, Filter } from '@contember/binding'
import { DataGridColumns, DataGridFilterArtifactStore, getColumnFilter } from '../base'

export const collectFilters = (
	columns: DataGridColumns,
	filters: DataGridFilterArtifactStore,
	environment: Environment,
): Filter | undefined => {
	const mapped: Filter[] = []

	for (const [key, artifact] of filters) {
		const column = columns.get(key)
		if (column === undefined) {
			continue
		}

		const filter = getColumnFilter(column, artifact, environment)
		if (filter !== undefined) {
			mapped.push(filter)
		}
	}

	if (mapped.length === 0) {
		return undefined
	}
	if (mapped.length === 1) {
		return mapped[0]
	}
	return { and: mapped }
}
