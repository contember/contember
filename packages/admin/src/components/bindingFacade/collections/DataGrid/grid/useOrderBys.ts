import { useCallback } from 'react'
import type { DataGridColumns, DataGridOrderDirectionStore, DataGridSetColumnOrderBy } from '../base'
import type { GridPagingAction } from '../paging'
import { normalizeInitialOrderBys } from './normalizeInitialOrderBys'
import { useSessionStorageState } from './useStoredState'

export const useOrderBys = (
	columns: DataGridColumns,
	updatePaging: (action: GridPagingAction) => void,
	dataGridKey: string,
): [DataGridOrderDirectionStore, DataGridSetColumnOrderBy] => {
	const [orderBys, setOrderBys] = useSessionStorageState<DataGridOrderDirectionStore>(
		`${dataGridKey}-orderBy`,
		val => normalizeInitialOrderBys(val, columns),
	)

	return [
		orderBys,
		useCallback(
			(columnKey, columnOrderBy, append) => {
				const column = columns.get(columnKey)
				if (column === undefined || column.enableOrdering === false) {
					return
				}
				let didBailOut = false

				setOrderBys(orderBys => {
					const existingValue = orderBys[columnKey]

					if (existingValue === columnOrderBy) {
						didBailOut = true
						return orderBys
					}
					if (columnOrderBy === null) {
						const { [columnKey]: _, ...rest } = orderBys
						return rest
					}
					return append ? { ...orderBys, [columnKey]: columnOrderBy } : { [columnKey]: columnOrderBy }
				})
				if (!didBailOut) {
					updatePaging({
						type: 'goToFirstPage',
					})
				}
			},
			[columns, setOrderBys, updatePaging],
		),
	]
}
