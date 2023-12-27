import { BoardColumn, BoardColumnValue } from '../BoardBindingProps'
import { useMemo } from 'react'
import { UseGroupItemsByColumn } from './useGroupItemsByColumn'
import { EntityListAccessor } from '@contember/react-binding'
import { BoardNullColumnPlaceholder } from '../const'
import { BoardNullBehaviourProps } from '../types'

export const useBoardColumns = <ColumnValue extends BoardColumnValue>({ groupItemsByColumn, items, columns, nullColumn, nullColumnPlacement, columnIdGetter }: {
	items: EntityListAccessor
	columns: Iterable<ColumnValue>
	columnIdGetter: (column: ColumnValue) => string | number
	groupItemsByColumn: UseGroupItemsByColumn,
} & BoardNullBehaviourProps): BoardColumn<ColumnValue>[] => {

	return useMemo(() => {
		const itemsByColumn = groupItemsByColumn(items)

		const result: BoardColumn<ColumnValue>[] = []
		let index = 0
		const nullItems = itemsByColumn.get(null) ?? []

		const pushNullColumn = () => {
			if (nullColumn === 'never') {
				return
			}
			if (nullColumn === 'auto' && nullItems.length === 0) {
				return
			}

			result.push({
				id: BoardNullColumnPlaceholder,
				index: index++,
				value: null,
				items: nullItems.map((it, index) => ({ value: it, id: it.id, index })),
			})
		}

		if (nullColumnPlacement === 'start') {
			index--
			pushNullColumn()
		}

		for (const column of columns) {
			result.push({
				id: columnIdGetter(column),
				index: index++,
				value: column,
				items: itemsByColumn.get(columnIdGetter(column))?.map((it, index) => ({ value: it, id: it.id, index })) ?? [],
			})
		}

		if (nullColumnPlacement !== 'start') {
			pushNullColumn()
		}
		return result
	}, [columnIdGetter, columns, groupItemsByColumn, items, nullColumn, nullColumnPlacement])
}
