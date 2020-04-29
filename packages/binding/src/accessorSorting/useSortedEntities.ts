import * as React from 'react'
import { useOptionalDesugaredRelativeSingleField } from '../accessorRetrievers'
import { EntityAccessor, EntityListAccessor } from '../accessors'
import { SugaredFieldProps } from '../helperComponents'
import { RelativeSingleField } from '../treeParameters'
import { addNewEntityAtIndex } from './addNewEntityAtIndex'
import { throwNonWritableError, throwNoopError } from './errors'
import { moveEntity } from './moveEntity'
import { repairEntitiesOrder } from './repairEntitiesOrder'
import { sortEntities } from './sortEntities'

export interface SortedEntities {
	entities: EntityAccessor[]
	prependNew: (preprocess?: (getAccessor: () => EntityListAccessor, newKey: string) => void) => void
	appendNew: (preprocess?: (getAccessor: () => EntityListAccessor, newKey: string) => void) => void
	addNewAtIndex: (index: number, preprocess?: (getAccessor: () => EntityListAccessor, newKey: string) => void) => void
	moveEntity: (oldIndex: number, newIndex: number) => void
}

const addNewAtIndexImplementation = (
	callbackName: keyof SortedEntities,
	entityList: EntityListAccessor,
	desugaredSortableByField: RelativeSingleField | undefined,
	sortedEntitiesCount: number,
	index: number,
	preprocess?: (getAccessor: () => EntityListAccessor, newKey: string) => void,
) => {
	if (!entityList.addNew) {
		return throwNonWritableError(entityList)
	}
	if (!desugaredSortableByField) {
		if (index === sortedEntitiesCount) {
			return entityList.addNew()
		}
		return throwNoopError(callbackName)
	}
	addNewEntityAtIndex(entityList, desugaredSortableByField, index, preprocess)
}

export const useSortedEntities = (
	entityList: EntityListAccessor,
	sortableByField: SugaredFieldProps['field'] | undefined,
): SortedEntities => {
	const desugaredSortableByField = useOptionalDesugaredRelativeSingleField(sortableByField)
	const sortedEntities = React.useMemo(() => {
		const filteredEntities = entityList.getFilteredEntities()
		return sortEntities(filteredEntities, desugaredSortableByField)
	}, [desugaredSortableByField, entityList])

	const addNewAtIndex = React.useCallback<SortedEntities['addNewAtIndex']>(
		(index: number, preprocess?: (getAccessor: () => EntityListAccessor, newKey: string) => void) => {
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
	const prependNew = React.useCallback<SortedEntities['prependNew']>(
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
	const appendNew = React.useCallback<SortedEntities['appendNew']>(
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
	const normalizedMoveEntity = React.useCallback<SortedEntities['moveEntity']>(
		(oldIndex, newIndex) => {
			if (!desugaredSortableByField) {
				return throwNoopError('moveEntity')
			}
			moveEntity(entityList, desugaredSortableByField, oldIndex, newIndex)
		},
		[desugaredSortableByField, entityList],
	)

	React.useEffect(() => {
		if (!desugaredSortableByField) {
			return
		}
		repairEntitiesOrder(desugaredSortableByField, entityList, sortedEntities)
	}, [desugaredSortableByField, entityList, sortedEntities])

	return React.useMemo<SortedEntities>(
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
