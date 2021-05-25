import { useCallback, useState } from 'react'
import type { DataGridColumns, DataGridHiddenColumnsStateStore, DataGridSetIsColumnHidden } from '../base'
import { normalizeInitialHiddenColumnsState } from './normalizeInitialHiddenColumnsState'

export const useHiddenColumnsState = (
	columns: DataGridColumns,
): [DataGridHiddenColumnsStateStore, DataGridSetIsColumnHidden] => {
	const [hiddenColumns, setHiddenColumns] = useState<DataGridHiddenColumnsStateStore>(() =>
		normalizeInitialHiddenColumnsState(columns),
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
					const isCurrentlyHidden = hiddenColumns.has(columnKey)

					if (isCurrentlyHidden === isToBeHidden) {
						return hiddenColumns
					}
					const clone: DataGridHiddenColumnsStateStore = new Set(hiddenColumns)

					if (isToBeHidden) {
						clone.add(columnKey)
					} else {
						clone.delete(columnKey)
					}

					return clone
				})
			},
			[columns],
		),
	]
}
