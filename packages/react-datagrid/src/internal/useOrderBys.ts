import { useCallback } from 'react'
import { normalizeInitialOrderBys } from './normalizeInitialOrderBys'
import { useSessionStorageState } from '@contember/react-utils'
import { DataGridColumns, DataGridOrderDirectionStore, DataGridSetColumnOrderBy, GridPagingAction } from '../types'
import { cycleOrderDirection } from './cycleOrderDirection'

export const useOrderBys = (
	columns: DataGridColumns<any>,
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
					const resolvedValue = columnOrderBy === 'next' ? cycleOrderDirection(existingValue) : columnOrderBy
					if (resolvedValue === null) {
						const { [columnKey]: _, ...rest } = orderBys
						return rest
					}
					return append ? { ...orderBys, [columnKey]: resolvedValue } : { [columnKey]: resolvedValue }
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
