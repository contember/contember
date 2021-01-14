import { Environment } from '@contember/binding'
import { DataGridColumns, DataGridOrderBys } from '../base'

export const normalizeInitialOrderBys = (columns: DataGridColumns, environment: Environment): DataGridOrderBys => {
	const orderBys: DataGridOrderBys = new Map()

	for (const [i, value] of columns) {
		if (value.enableOrdering !== false && value.initialOrder && value.getNewOrderBy) {
			const newOrderBy = value.getNewOrderBy(value.initialOrder, { environment })
			newOrderBy && orderBys.set(i, newOrderBy)
		}
	}

	return orderBys
}
