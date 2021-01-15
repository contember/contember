import { Environment, Filter, QueryLanguage } from '@contember/binding'
import { DataGridColumnKey, DataGridColumns, DataGridFilterArtifact } from '../base'

export const getColumnFilter = (
	columns: DataGridColumns,
	key: DataGridColumnKey,
	artifact: DataGridFilterArtifact,
	environment: Environment,
): Filter | undefined => {
	const column = columns.get(key)
	if (column === undefined || column.enableFiltering === false) {
		return undefined
	}
	const sugaredFilter = column.getNewFilter(artifact, {
		environment,
	})
	if (sugaredFilter === undefined) {
		return undefined
	}
	return QueryLanguage.desugarFilter(sugaredFilter, environment)
}
