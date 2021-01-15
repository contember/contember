import { DataGridColumns, DataGridOrderDirectionStore } from '../base'

export const normalizeInitialOrderBys = (columns: DataGridColumns): DataGridOrderDirectionStore => {
	const orderBys: DataGridOrderDirectionStore = new Map()

	for (const [i, value] of columns) {
		if (value.enableOrdering !== false && value.initialOrder) {
			orderBys.set(i, value.initialOrder)
		}
	}

	return orderBys
}
