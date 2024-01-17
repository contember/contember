import { useCallback } from 'react'
import { normalizeInitialHiddenColumnsState } from './normalizeInitialHiddenColumnsState'
import { useSessionStorageState } from '@contember/react-utils'
import { DataGridColumns, DataGridHidingState, DataGridSetIsColumnHidden } from '../types'

export const useHiddenColumnsState = (
	columns: DataGridColumns<any>,
	dataGridKey: string,
): [DataGridHidingState, DataGridSetIsColumnHidden] => {
	const [hiddenColumns, setHiddenColumns] = useSessionStorageState<DataGridHidingState>(
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
