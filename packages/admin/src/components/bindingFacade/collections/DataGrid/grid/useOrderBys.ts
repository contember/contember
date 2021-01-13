import { useEnvironment } from '@contember/binding'
import * as React from 'react'
import { DataGridColumns, DataGridOrderBys, DataGridSetColumnOrderBy } from '../base'
import { GridPagingAction } from '../paging'

export const useOrderBys = (
	columns: DataGridColumns,
	updatePaging: (action: GridPagingAction) => void,
): [DataGridOrderBys, DataGridSetColumnOrderBy] => {
	const environment = useEnvironment()
	const [orderBys, setOrderBys] = React.useState<DataGridOrderBys>(new Map())

	return [
		orderBys,
		React.useCallback(
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
					const clone = new Map(orderBys)

					if (columnOrderBy === undefined) {
						clone.delete(columnKey)
					} else if (typeof columnOrderBy === 'string') {
						if (column.getNewOrderBy) {
							clone.set(
								columnKey,
								column.getNewOrderBy(columnOrderBy, {
									environment,
								}),
							)
						} else {
							// TODO
						}
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
			[columns, environment, updatePaging],
		),
	]
}
