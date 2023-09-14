import { useCallback } from 'react'
import { normalizeInitialFilters } from './normalizeInitialFilters'
import { useSessionStorageState } from '@contember/react-utils'
import { DataGridColumns, DataGridFilterArtifactStore, DataGridSetColumnFilter, GridPagingAction } from '../types'

export const useFilters = (
	columns: DataGridColumns<any>,
	updatePaging: (action: GridPagingAction) => void,
	dataGridKey: string,
): [DataGridFilterArtifactStore, DataGridSetColumnFilter] => {
	const [filters, setFilters] = useSessionStorageState<DataGridFilterArtifactStore>(`${dataGridKey}-filters`, val => normalizeInitialFilters(val, columns))

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
					const { [columnKey]: existingValue, ...otherFilters } = filters

					if (existingValue === columnFilter) {
						didBailOut = true
						return filters
					}
					if (columnFilter === undefined) {
						return otherFilters
					} else {
						return { ...otherFilters, [columnKey]: columnFilter }
					}
				})
				if (!didBailOut) {
					updatePaging({
						type: 'goToFirstPage',
					})
				}
			},
			[columns, setFilters, updatePaging],
		),
	]
}
