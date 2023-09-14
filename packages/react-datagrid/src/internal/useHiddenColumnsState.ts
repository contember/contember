import { useCallback } from 'react'
import { normalizeInitialHiddenColumnsState } from './normalizeInitialHiddenColumnsState'
import { useSessionStorageState } from '@contember/react-utils'
import { DataGridColumns, DataGridHiddenColumnsStateStore, DataGridSetIsColumnHidden } from '../types'

export const useHiddenColumnsState = (
	columns: DataGridColumns<any>,
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
