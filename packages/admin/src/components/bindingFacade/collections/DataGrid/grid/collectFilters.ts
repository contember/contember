import { Environment, Filter } from '@contember/binding'
import { DataGridColumns, DataGridFilterArtifactStore } from '../base'
import { getColumnFilter } from './getColumnFilter'

export const collectFilters = (
	columns: DataGridColumns,
	filters: DataGridFilterArtifactStore,
	environment: Environment,
): Filter | undefined => {
	const mapped: Filter[] = []

	for (const [key, artifact] of filters) {
		const filter = getColumnFilter(columns, key, artifact, environment)

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
