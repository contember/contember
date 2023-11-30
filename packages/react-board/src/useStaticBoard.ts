import { useCallback } from 'react'
import { EntityAccessor, EntityListAccessor, useDesugaredRelativeSingleField } from '@contember/react-binding'
import { BoardBindingProps, BoardStaticColumnValue } from './BoardBindingProps'
import { useGroupItemsByColumn } from './internal/useGroupItemsByColumn'
import { useBoardColumns } from './internal/useBoardColumns'
import { BoardCommonProps, BoardStaticColumnsBindingProps } from './types'
import { useBoardItemsMethods } from './internal/useBoardItemsMethods'


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
	nullColumnPlacement = 'end',
	nullColumn = 'auto',
}: UseStaticBoardBindingProps): BoardBindingProps<BoardStaticColumnValue> => {

	const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)
	const desugaredDiscriminationField = useDesugaredRelativeSingleField(discriminationField)

	const getDiscriminatorValue = useCallback((entity: EntityAccessor) => {
		return entity.getRelativeSingleField<string>(desugaredDiscriminationField).value
	}, [desugaredDiscriminationField])

	const groupItemsByColumn = useGroupItemsByColumn(getDiscriminatorValue, desugaredSortableByField)

	const columnsResult = useBoardColumns({
		columns,
		columnIdGetter: it => it.value,
		groupItemsByColumn,
		items: itemEntities,
		nullColumn,
		nullColumnPlacement,
	})

	const connectItemToColumn = useCallback((item: EntityAccessor, column: BoardStaticColumnValue | null) => {
		item.getRelativeSingleField(desugaredDiscriminationField).updateValue(column?.value ?? null)
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
	return {
		columns: columnsResult,
		addItem,
		moveItem,
		removeItem,
	}
}
