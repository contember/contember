import { useCallback, useState } from 'react'
import type { DataGridColumns, DataGridOrderDirectionStore, DataGridSetColumnOrderBy } from '../base'
import type { GridPagingAction } from '../paging'
import { normalizeInitialOrderBys } from './normalizeInitialOrderBys'

export const useOrderBys = (
	columns: DataGridColumns,
	updatePaging: (action: GridPagingAction) => void,
): [DataGridOrderDirectionStore, DataGridSetColumnOrderBy] => {
	const [orderBys, setOrderBys] = useState<DataGridOrderDirectionStore>(() => normalizeInitialOrderBys(columns))

	return [
		orderBys,
		useCallback(
			(columnKey, columnOrderBy) => {
				const column = columns.get(columnKey)
				if (column === undefined || column.enableOrdering === false) {
					return
				}
				let didBailOut = false

				setOrderBys(orderBys => {
					const existingValue = orderBys.get(columnKey)

					if (existingValue === columnOrderBy) {
						// TODO perform better comparisons by value
						didBailOut = true
						return orderBys
					}
					//const clone = new Map(orderBys)
					const clone: DataGridOrderDirectionStore = new Map()

					if (columnOrderBy === undefined) {
						clone.delete(columnKey)
					} else {
						clone.set(columnKey, columnOrderBy)
					}

					return clone
				})
				if (!didBailOut) {
					updatePaging({
						type: 'goToFirstPage',
					})
				}
			},
			[columns, updatePaging],
		),
	]
}
