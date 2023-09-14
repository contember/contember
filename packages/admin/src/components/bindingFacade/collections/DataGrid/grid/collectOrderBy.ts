import type { Environment, OrderBy } from '@contember/react-binding'
import { DataGridColumns, DataGridOrderDirectionStore, getColumnOrderBy } from '../base'

export const collectOrderBy = (
	columns: DataGridColumns,
	directionStore: DataGridOrderDirectionStore,
	environment: Environment,
): OrderBy => {
	return Object.entries(directionStore).flatMap(([key, direction]) => {
		const orderBy = getColumnOrderBy(columns, key, direction, environment)
		return orderBy ?? []
	})
}
