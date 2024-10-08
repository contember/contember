import { useCallback, useMemo } from 'react'
import {
	addEntityAtIndex,
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	RelativeSingleField,
	repairEntitiesOrder,
	sortEntities,
	useDesugaredRelativeSingleEntity,
	useDesugaredRelativeSingleField,
} from '@contember/react-binding'
import {
	BoardAddColumnMethod,
	BoardMethods,
	BoardMoveColumnMethod,
	BoardRemoveColumnMethod,
} from '../types'
import { useGroupItemsByColumn } from './useGroupItemsByColumn'
import { useCreateBoardColumns } from './useCreateBoardColumns'
import { arrayMove } from '../utils/arrayMove'
import { useBoardItemsMethods } from './useBoardItemsMethods'
import { BoardData } from '../types/BoardData'
import { BoardCommonProps, BoardDynamicColumnsBindingProps } from '../components'


export type UseDynamicBoardBindingProps =
	& Omit<BoardCommonProps, 'children'>
	& BoardDynamicColumnsBindingProps
	& {
		columnEntities: EntityListAccessor
		itemEntities: EntityListAccessor
	}

const useGetSortedColumns = (desugaredColumnSortableByField: RelativeSingleField | undefined) => {
	return useCallback((columnEntities: EntityListAccessor) => {
		return sortEntities(Array.from(columnEntities), desugaredColumnSortableByField)
	}, [desugaredColumnSortableByField])
}

export const useDynamicBoard = ({
	sortableBy,
	sortScope,
	columnsSortableBy,
	discriminationField,
	columnEntities,
	itemEntities,
}: UseDynamicBoardBindingProps): [BoardData<EntityAccessor>, BoardMethods<EntityAccessor>] => {

	const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)
	const desugaredColumnSortableByField = useDesugaredRelativeSingleField(columnsSortableBy)
	const desugaredDiscriminationField = useDesugaredRelativeSingleEntity(discriminationField)

	const columnEntitiesGetter = columnEntities.getAccessor


	const exitingColumnIds = useMemo(() => new Set(Array.from(columnEntities).map(it => it.id)), [columnEntities])

	const getDiscriminatorValue = useCallback((entity: EntityAccessor) => {
		const entityId = entity.getEntity(desugaredDiscriminationField).id
		return exitingColumnIds.has(entityId) ? entityId : null
	}, [desugaredDiscriminationField, exitingColumnIds])

	const groupItemsByColumn = useGroupItemsByColumn(getDiscriminatorValue, desugaredSortableByField)

	const getSortedColumns = useGetSortedColumns(desugaredColumnSortableByField)

	const columnsResult = useCreateBoardColumns<EntityAccessor>({
		columns: getSortedColumns(columnEntities),
		columnIdGetter: it => it.id,
		groupItemsByColumn,
		items: itemEntities,
	})

	const addColumn = useCallback<BoardAddColumnMethod>((index, preprocess) => {
		const columnEntities = columnEntitiesGetter()
		if (!desugaredColumnSortableByField) {
			if (index === undefined) {
				return columnEntities.createNewEntity(preprocess)
			}
			throw new BindingError('Cannot add column at specific index without sortableBy field')
		}
		addEntityAtIndex(columnEntities, desugaredColumnSortableByField, columnEntities.length, preprocess)
	}, [columnEntitiesGetter, desugaredColumnSortableByField])

	const connectItemToColumn = useCallback((item: EntityAccessor, column: EntityAccessor | null) => {
		const hasOne = desugaredDiscriminationField.hasOneRelationPath
		const parentEntity = item.getEntity({ hasOneRelationPath: hasOne.slice(0, -1) })
		if (column) {
			parentEntity.connectEntityAtField(hasOne[hasOne.length - 1].field, column)
		} else {
			parentEntity.disconnectEntityAtField(hasOne[hasOne.length - 1].field)
		}

	}, [desugaredDiscriminationField.hasOneRelationPath])


	const moveColumn = useMemo<BoardMoveColumnMethod | undefined>(() => {
		if (!desugaredColumnSortableByField) {
			return undefined
		}
		return (entity, index) => {
			const sortedColumns = getSortedColumns(columnEntitiesGetter())
			const currentIndex = sortedColumns.findIndex(it => it.id === entity.id)
			const resortedItems = arrayMove(sortedColumns, currentIndex, index)
			repairEntitiesOrder(desugaredColumnSortableByField, resortedItems)
		}
	}, [columnEntitiesGetter, desugaredColumnSortableByField, getSortedColumns])


	const removeColumn = useCallback<BoardRemoveColumnMethod>(entity => {
		entity.deleteEntity()
		if (desugaredSortableByField) {
			repairEntitiesOrder(desugaredSortableByField, Array.from(columnEntitiesGetter()))
		}
	}, [columnEntitiesGetter, desugaredSortableByField])

	const { addItem, moveItem, removeItem } = useBoardItemsMethods({
		columnIdGetter: it => it.id,
		connectItemToColumn,
		desugaredSortableByField,
		sortScope,
		getDiscriminatorValue,
		groupItemsByColumn,
		itemEntities,
	})

	const methods = useMemo(() => ({
		addItem,
		moveItem,
		removeItem,
		moveColumn,
		addColumn,
		removeColumn,
	}), [addItem, moveItem, removeItem, moveColumn, addColumn, removeColumn])

	return [{ columns: columnsResult }, methods]
}
