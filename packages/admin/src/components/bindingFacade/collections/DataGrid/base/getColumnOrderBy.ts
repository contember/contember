import { Environment, OrderBy, QueryLanguage } from '@contember/react-binding'
import type { DataGridColumns } from './DataGridColumn'
import type { DataGridColumnKey } from './DataGridColumnKey'
import type { DataGridOrderDirection } from './DataGridOrderDirection'

export const getColumnOrderBy = (
	columns: DataGridColumns,
	key: DataGridColumnKey,
	direction: DataGridOrderDirection,
	environment: Environment,
): OrderBy | undefined => {
	const column = columns.get(key)
	if (column === undefined || column.enableOrdering === false) {
		return undefined
	}
	const sugaredOrderBy = column.getNewOrderBy(direction, {
		environment,
	})
	if (sugaredOrderBy === undefined) {
		return undefined
	}
	return QueryLanguage.desugarOrderBy(sugaredOrderBy, environment)
}
