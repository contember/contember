import { useMemo } from 'react'
import { UseGroupItemsByColumn } from './useGroupItemsByColumn'
import { EntityListAccessor } from '@contember/react-binding'
import { BoardNullColumnPlaceholder } from '../const'
import { BoardColumnNode, BoardColumnValue } from '../types'

export const useCreateBoardColumns = <ColumnValue extends BoardColumnValue>({ groupItemsByColumn, items, columns, columnIdGetter }: {
	items: EntityListAccessor
	columns: Iterable<ColumnValue>
	columnIdGetter: (column: ColumnValue) => string | number
	groupItemsByColumn: UseGroupItemsByColumn,
}): BoardColumnNode<ColumnValue>[] => {

	return useMemo(() => {
		const itemsByColumn = groupItemsByColumn(items)

		const nullItems = itemsByColumn.get(null) ?? []
		const result: BoardColumnNode<ColumnValue>[] = [
			{
				id: BoardNullColumnPlaceholder,
				index: Number.MAX_SAFE_INTEGER,
				value: null,
				items: nullItems.map((it, index) => ({ value: it, id: it.id, index })),
			},
		]
		let index = 0


		for (const column of columns) {
			result.push({
				id: columnIdGetter(column),
				index: index++,
				value: column,
				items: itemsByColumn.get(columnIdGetter(column))?.map((it, index) => ({ value: it, id: it.id, index })) ?? [],
			})
		}
		return result

	}, [columnIdGetter, columns, groupItemsByColumn, items])
}
