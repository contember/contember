import type { Environment, OrderBy } from '@contember/binding'
import { DataGridColumns, DataGridOrderDirectionStore, getColumnOrderBy } from '../base'

export const collectOrderBy = (
	columns: DataGridColumns,
	directionStore: DataGridOrderDirectionStore,
	environment: Environment,
): OrderBy | undefined => {
	// TODO This implementation uses column order. Shouldn't we use insertion order instead?
	const mapped: OrderBy[] = []

	for (const [key, direction] of Object.entries(directionStore)) {
		const orderBy = getColumnOrderBy(columns, key, direction, environment)

		if (orderBy !== undefined) {
			mapped.push(orderBy)
		}
	}

	return mapped.length ? mapped.flat(1) : undefined
}
