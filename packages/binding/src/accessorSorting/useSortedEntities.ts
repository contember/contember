import { useCallback, useMemo } from 'react'
import { useDesugaredRelativeSingleField } from '../accessorPropagation'
import { EntityAccessor, EntityListAccessor } from '../accessors'
import { SugaredFieldProps } from '../helperComponents'
import { RelativeSingleField } from '../treeParameters'
import { addEntityAtIndex } from './addEntityAtIndex'
import { throwNonWritableError, throwNoopError } from './errors'
import { moveEntity } from './moveEntity'
import { sortEntities } from './sortEntities'

export interface SortedEntities {
	entities: EntityAccessor[]
	prependNew: (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	appendNew: (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	addNewAtIndex: (index: number, preprocess?: EntityAccessor.BatchUpdatesHandler) => void
	moveEntity: (oldIndex: number, newIndex: number) => void
}

const addNewAtIndexImplementation = (
	callbackName: keyof SortedEntities,
	entityList: EntityListAccessor,
	desugaredSortableByField: RelativeSingleField | undefined,
	sortedEntitiesCount: number,
	index: number,
	preprocess?: EntityAccessor.BatchUpdatesHandler,
) => {
	if (!desugaredSortableByField) {
		if (index === sortedEntitiesCount) {
			return entityList.createNewEntity()
		}
		return throwNoopError(callbackName)
	}
	addEntityAtIndex(entityList, desugaredSortableByField, index, preprocess)
}

export const useSortedEntities = (
	entityList: EntityListAccessor,
	sortableByField: SugaredFieldProps['field'] | undefined,
): SortedEntities => {
	const desugaredSortableByField = useDesugaredRelativeSingleField(sortableByField)
	const sortedEntities = useMemo(() => {
		return sortEntities(Array.from(entityList), desugaredSortableByField)
	}, [desugaredSortableByField, entityList])

	const addNewAtIndex = useCallback<SortedEntities['addNewAtIndex']>(
		(index: number, preprocess?: EntityAccessor.BatchUpdatesHandler) => {
			addNewAtIndexImplementation(
				'addNewAtIndex',
				entityList,
				desugaredSortableByField,
				sortedEntities.length,
				index,
				preprocess,
			)
		},
		[desugaredSortableByField, entityList, sortedEntities.length],
	)
	const prependNew = useCallback<SortedEntities['prependNew']>(
		preprocess => {
			addNewAtIndexImplementation(
				'prependNew',
				entityList,
				desugaredSortableByField,
				sortedEntities.length,
				0,
				preprocess,
			)
		},
		[desugaredSortableByField, entityList, sortedEntities.length],
	)
	const appendNew = useCallback<SortedEntities['appendNew']>(
		preprocess => {
			addNewAtIndexImplementation(
				'appendNew',
				entityList,
				desugaredSortableByField,
				sortedEntities.length,
				sortedEntities.length,
				preprocess,
			)
		},
		[desugaredSortableByField, entityList, sortedEntities.length],
	)
	const normalizedMoveEntity = useCallback<SortedEntities['moveEntity']>(
		(oldIndex, newIndex) => {
			if (!desugaredSortableByField) {
				return throwNoopError('moveEntity')
			}
			moveEntity(entityList, desugaredSortableByField, oldIndex, newIndex)
		},
		[desugaredSortableByField, entityList],
	)

	// This wasn't such a great idea…
	// useEffect(() => {
	// 	if (!desugaredSortableByField) {
	// 		return
	// 	}
	// 	repairEntitiesOrder(desugaredSortableByField, entityList, sortedEntities)
	// }, [desugaredSortableByField, entityList, sortedEntities])

	return useMemo<SortedEntities>(
		() => ({
			entities: sortedEntities,
			addNewAtIndex,
			appendNew,
			prependNew,
			moveEntity: normalizedMoveEntity,
		}),
		[sortedEntities, addNewAtIndex, appendNew, prependNew, normalizedMoveEntity],
	)
}
