import { useCallback, useMemo } from 'react'
import { useDesugaredRelativeSingleField } from '../accessorPropagation'
import type { EntityAccessor, EntityListAccessor } from '../accessors'
import type { SugaredFieldProps } from '../helperComponents'
import type { RelativeSingleField } from '../treeParameters'
import { addEntityAtIndex } from './addEntityAtIndex'
import { throwNoopError } from './errors'
import { moveEntity } from './moveEntity'
import type { SortedEntities } from './SortedEntities'
import { sortEntities } from './sortEntities'

const addNewAtIndexImplementation = (
	callbackName: keyof SortedEntities,
	entityList: EntityListAccessor,
	desugaredSortableByField: RelativeSingleField | undefined,
	index: number,
	preprocess?: EntityAccessor.BatchUpdatesHandler,
) => {
	if (!desugaredSortableByField) {
		if (index === entityList.length) {
			return entityList.createNewEntity(preprocess)
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

	const addNewAtIndex = useCallback<SortedEntities['addNewAtIndex']>(
		(index: number | undefined, preprocess?: EntityAccessor.BatchUpdatesHandler) => {
			addNewAtIndexImplementation(
				'addNewAtIndex',
				entityList.getAccessor(),
				desugaredSortableByField,
				index ?? entityList.getAccessor().length,
				preprocess,
			)
		},
		[desugaredSortableByField, entityList],
	)
	const prependNew = useCallback<SortedEntities['prependNew']>(
		preprocess => {
			addNewAtIndexImplementation(
				'prependNew',
				entityList.getAccessor(),
				desugaredSortableByField,
				0,
				preprocess,
			)
		},
		[desugaredSortableByField, entityList],
	)
	const appendNew = useCallback<SortedEntities['appendNew']>(
		preprocess => {
			addNewAtIndexImplementation(
				'appendNew',
				entityList.getAccessor(),
				desugaredSortableByField,
				entityList.getAccessor().length,
				preprocess,
			)
		},
		[desugaredSortableByField, entityList],
	)
	const normalizedMoveEntity = useCallback<SortedEntities['moveEntity']>(
		(oldIndex, newIndex) => {
			if (!desugaredSortableByField) {
				return throwNoopError('moveEntity')
			}
			moveEntity(entityList.getAccessor(), desugaredSortableByField, oldIndex, newIndex)
		},
		[desugaredSortableByField, entityList],
	)

	const sortedEntities = useMemo(() => {
		return sortEntities(Array.from(entityList), desugaredSortableByField)
	}, [desugaredSortableByField, entityList])

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
