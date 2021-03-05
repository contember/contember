import { useCallback, useState } from 'react'
import { DataGridColumns, DataGridFilterArtifactStore, DataGridSetColumnFilter } from '../base'
import { GridPagingAction } from '../paging'
import { normalizeInitialFilters } from './normalizeInitialFilters'

export const useFilters = (
	columns: DataGridColumns,
	updatePaging: (action: GridPagingAction) => void,
): [DataGridFilterArtifactStore, DataGridSetColumnFilter] => {
	const [filters, setFilters] = useState<DataGridFilterArtifactStore>(() => normalizeInitialFilters(columns))

	return [
		filters,
		useCallback(
			(columnKey, columnFilter) => {
				const column = columns.get(columnKey)
				if (column === undefined || column.enableFiltering === false) {
					return
				}
				let didBailOut = false

				setFilters(filters => {
					const existingValue = filters.get(columnKey)

					if (existingValue === columnFilter) {
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
