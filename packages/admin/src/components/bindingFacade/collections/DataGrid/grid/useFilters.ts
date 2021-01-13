import * as React from 'react'
import { DataGridColumns, DataGridFilters, DataGridSetColumnFilter } from '../base'
import { GridPagingAction } from '../paging'

export const useFilters = (
	columns: DataGridColumns,
	updatePaging: (action: GridPagingAction) => void,
): [DataGridFilters, DataGridSetColumnFilter] => {
	const [filters, setFilters] = React.useState<DataGridFilters>(new Map())

	return [
		filters,
		React.useCallback(
			(columnKey, columnFilter) => {
				const column = columns.get(columnKey)
				if (column === undefined || column.enableFiltering === false) {
					return
				}
				let didBailOut = false

				setFilters(filters => {
					const existingValue = filters.get(columnKey)

					if (existingValue === columnFilter) {
						// TODO perform better comparisons by value
						didBailOut = true
						return filters
					}
					const clone = new Map(filters)

					if (columnFilter === undefined) {
						clone.delete(columnKey)
					} else {
						clone.set(columnKey, columnFilter)
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
