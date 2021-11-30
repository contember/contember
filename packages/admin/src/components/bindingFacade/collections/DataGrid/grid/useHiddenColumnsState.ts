import { useCallback } from 'react'
import type { DataGridColumns, DataGridHiddenColumnsStateStore, DataGridSetIsColumnHidden } from '../base'
import { normalizeInitialHiddenColumnsState } from './normalizeInitialHiddenColumnsState'
import { useSessionStorageState } from './useStoredState'

export const useHiddenColumnsState = (
	columns: DataGridColumns,
	dataGridKey: string,
): [DataGridHiddenColumnsStateStore, DataGridSetIsColumnHidden] => {
	const [hiddenColumns, setHiddenColumns] = useSessionStorageState<DataGridHiddenColumnsStateStore>(
		`${dataGridKey}-hidden`,
		val => normalizeInitialHiddenColumnsState(val, columns),
	)

	return [
		hiddenColumns,
		useCallback(
			(columnKey, isToBeHidden) => {
				const column = columns.get(columnKey)
				if (column === undefined) {
					return
				}

				setHiddenColumns(hiddenColumns => {
					return { ...hiddenColumns, [columnKey]: isToBeHidden }
				})
			},
			[columns, setHiddenColumns],
		),
	]
}
