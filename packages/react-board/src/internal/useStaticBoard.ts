import { useCallback, useMemo } from 'react'
import { EntityAccessor, EntityListAccessor, useDesugaredRelativeSingleField } from '@contember/react-binding'
import { BoardMethods, BoardStaticColumnValue } from '../types/index.js'
import { useGroupItemsByColumn } from './useGroupItemsByColumn.js'
import { useCreateBoardColumns } from './useCreateBoardColumns.js'
import { useBoardItemsMethods } from './useBoardItemsMethods.js'
import { BoardData } from '../types/BoardData.js'
import { BoardCommonProps, BoardStaticColumnsBindingProps } from '../components/index.js'

export type UseStaticBoardBindingProps =
	& Omit<BoardCommonProps, 'children'>
	& BoardStaticColumnsBindingProps
	& {
		itemEntities: EntityListAccessor
	}

export const useStaticBoard = ({
	sortableBy,
	sortScope,
	columns,
	discriminationField,
	itemEntities,
}: UseStaticBoardBindingProps): [BoardData<BoardStaticColumnValue>, BoardMethods<BoardStaticColumnValue>] => {
	const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)
	const desugaredDiscriminationField = useDesugaredRelativeSingleField(discriminationField)

	const getDiscriminatorValue = useCallback((entity: EntityAccessor) => {
		return entity.getField<string>(desugaredDiscriminationField).value
	}, [desugaredDiscriminationField])

	const groupItemsByColumn = useGroupItemsByColumn(getDiscriminatorValue, desugaredSortableByField)

	const columnsResult = useCreateBoardColumns({
		columns,
		columnIdGetter: it => it.value,
		groupItemsByColumn,
		items: itemEntities,
	})

	const connectItemToColumn = useCallback((item: EntityAccessor, column: BoardStaticColumnValue | null) => {
		item.getField(desugaredDiscriminationField).updateValue(column?.value ?? null)
	}, [desugaredDiscriminationField])

	const { addItem, moveItem, removeItem } = useBoardItemsMethods({
		columnIdGetter: it => it.value,
		connectItemToColumn,
		groupItemsByColumn,
		itemEntities,
		desugaredSortableByField,
		sortScope,
		getDiscriminatorValue,
	})

	const methods = useMemo(() => ({ addItem, moveItem, removeItem }), [addItem, moveItem, removeItem])

	return [{ columns: columnsResult }, methods]
}
