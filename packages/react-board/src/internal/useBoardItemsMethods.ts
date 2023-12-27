import { BoardAddItemMethod, BoardColumnValue, BoardMethods, BoardMoveItemMethod, BoardRemoveItemMethod } from '../BoardBindingProps'
import { useCallback, useMemo } from 'react'
import {
	BatchUpdatesOptions,
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	RelativeSingleField,
	repairEntitiesOrder, sortEntities,
} from '@contember/react-binding'
import { BoardColumnKey, UseGroupItemsByColumn } from './useGroupItemsByColumn'
import { arrayMove } from '../utils/arrayMove'


export type UseBoardItemsMethodsProps<ColumnValue extends BoardColumnValue> = {
	itemEntities: EntityListAccessor
	connectItemToColumn: (item: EntityAccessor, column: ColumnValue | null) => void
	desugaredSortableByField: RelativeSingleField | undefined
	sortScope?: 'column' | 'board'
	groupItemsByColumn: UseGroupItemsByColumn,
	getDiscriminatorValue: (entity: EntityAccessor) => BoardColumnKey
	columnIdGetter: (column: ColumnValue) => string | number
}

export type BoardItemsMethods<ColumnValue extends BoardColumnValue> = Pick<BoardMethods<ColumnValue>, 'moveItem' | 'addItem' | 'removeItem'>

export const useBoardItemsMethods = <ColumnValue extends BoardColumnValue>({
	itemEntities,
	desugaredSortableByField,
	connectItemToColumn,
	groupItemsByColumn,
	getDiscriminatorValue,
	columnIdGetter,
	sortScope = 'column',
}: UseBoardItemsMethodsProps<ColumnValue>): BoardItemsMethods<ColumnValue> => {

	const itemEntitiesEntitiesGetter = itemEntities.getAccessor

	const getSortScopeItems = useCallback((column: string | number | null) => {
		const itemEntities = itemEntitiesEntitiesGetter()
		return sortScope === 'column'
			? groupItemsByColumn(itemEntities).get(column)?.slice() ?? []
			: sortEntities(Array.from(itemEntities), desugaredSortableByField)
	}, [desugaredSortableByField, groupItemsByColumn, itemEntitiesEntitiesGetter, sortScope])

	const resolveScopedIndex = useCallback((column: string | number | null, index: number | undefined) => {
		if (index === undefined) {
			return undefined
		}
		if (sortScope === 'column') {
			return index
		}
		const columnItems = groupItemsByColumn(itemEntities).get(column)?.slice() ?? []
		const columnOnIndex = columnItems[index]
		if (!columnOnIndex) {
			return undefined
		}

		const sortScopeItems = getSortScopeItems(column)
		return sortScopeItems.findIndex(it => it.id === columnOnIndex.id) ?? sortScopeItems.length
	}, [getSortScopeItems, groupItemsByColumn, itemEntities, sortScope])

	const addItem = useCallback<BoardAddItemMethod<ColumnValue>>((column, index, preprocess) => {
		const itemEntities = itemEntitiesEntitiesGetter()
		const resolvedPreprocess = (getAccessor: () => EntityAccessor, options: BatchUpdatesOptions) => {
			connectItemToColumn(getAccessor(), column)
			preprocess?.(getAccessor, options)
		}
		if (!desugaredSortableByField) {
			if (index === undefined) {
				return itemEntities.createNewEntity(resolvedPreprocess)
			}
			throw new BindingError('Cannot add item at specific index without sortableBy field')
		}
		const columnId = column ? columnIdGetter(column) : null
		const sortScopeItems = getSortScopeItems(columnId)

		const resolvedIndex = resolveScopedIndex(columnId, index) ?? sortScopeItems.length


		itemEntities.createNewEntity((getEntity, options) => {
			sortScopeItems.splice(resolvedIndex, 0, getEntity())
			repairEntitiesOrder(desugaredSortableByField, sortScopeItems)
			resolvedPreprocess?.(getEntity, options)
		})
	}, [columnIdGetter, connectItemToColumn, desugaredSortableByField, getSortScopeItems, itemEntitiesEntitiesGetter, resolveScopedIndex])


	const moveItem = useMemo<BoardMoveItemMethod<ColumnValue> | undefined>(() => {
		if (!desugaredSortableByField) {
			return undefined
		}
		return (entity, column, index) => {
			const currentColumn = getDiscriminatorValue(entity)
			const columnId = column ? columnIdGetter(column) : null

			connectItemToColumn(entity, column)

			if (currentColumn === columnId || sortScope === 'board') {
				const sortScopeItems = getSortScopeItems(columnId)
				const currentIndex = sortScopeItems.findIndex(it => it.id === entity.id)
				const resolvedIndex = resolveScopedIndex(columnId, index) ?? sortScopeItems.length
				const resortedItems = arrayMove(sortScopeItems, currentIndex, resolvedIndex)
				repairEntitiesOrder(desugaredSortableByField, resortedItems)
				return
			}


			// sort scope is column
			const itemEntities = itemEntitiesEntitiesGetter()
			const groupedItems = groupItemsByColumn(itemEntities)

			const currentColumnItems = groupedItems.get(currentColumn ?? null)?.slice() ?? []
			const currentIndex = currentColumnItems.findIndex(it => it.id === entity.id)
			currentColumnItems.splice(currentIndex, 1)
			repairEntitiesOrder(desugaredSortableByField, currentColumnItems)

			const newColumnItems = groupedItems.get(columnId)?.slice() ?? []
			newColumnItems.splice(index, 0, entity)
			repairEntitiesOrder(desugaredSortableByField, newColumnItems)

		}
	}, [columnIdGetter, connectItemToColumn, desugaredSortableByField, getDiscriminatorValue, getSortScopeItems, groupItemsByColumn, itemEntitiesEntitiesGetter, resolveScopedIndex, sortScope])

	const removeItem = useCallback<BoardRemoveItemMethod>(entity => {
		if (desugaredSortableByField) {
			const currentColumn = getDiscriminatorValue(entity)
			const sortScopeItems = getSortScopeItems(currentColumn)
			const currentIndex = sortScopeItems.findIndex(it => it.id === entity.id)
			sortScopeItems.splice(currentIndex, 1)
			repairEntitiesOrder(desugaredSortableByField, sortScopeItems)
		}
		entity.deleteEntity()
	}, [desugaredSortableByField, getDiscriminatorValue, getSortScopeItems])

	return {
		addItem,
		moveItem,
		removeItem,
	}
}
