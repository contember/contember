import type { Environment, OrderBy } from '@contember/react-binding'
import { DataGridColumns, DataGridOrderDirectionStore } from '../types'
import { getColumnOrderBy } from './getColumnOrderBy'

export const collectOrderBy = (
	columns: DataGridColumns<any>,
	directionStore: DataGridOrderDirectionStore,
	environment: Environment,
): OrderBy => {
	return Object.entries(directionStore).flatMap(([key, direction]) => {
		const orderBy = getColumnOrderBy(columns, key, direction, environment)
		return orderBy ?? []
	})
}
