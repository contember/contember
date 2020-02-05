import * as React from 'react'
import { useOptionalDesugaredRelativeSingleField } from '../accessorRetrievers'
import { EntityAccessor, EntityListAccessor } from '../accessors'
import { SugaredRelativeSingleField } from '../treeParameters'
import { addNewEntityAtIndex } from './addNewEntityAtIndex'
import { throwNonWritableError, throwNoopError } from './errors'
import { moveEntity } from './moveEntity'
import { sortEntities } from './sortEntities'

export interface SortedEntities {
	entities: EntityAccessor[]
	prependNew: (preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void) => void
	appendNew: (preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void) => void
	addNewAtIndex: (index: number, preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void) => void
	moveEntity: (oldIndex: number, newIndex: number) => void
}

export const useSortedEntities = (
	entityList: EntityListAccessor,
	sortableByField: SugaredRelativeSingleField['field'] | undefined,
): SortedEntities => {
	const desugaredSortableByField = useOptionalDesugaredRelativeSingleField(sortableByField)
	const sortedEntities = React.useMemo(() => {
		const filteredEntities = entityList.getFilteredEntities()
		return sortEntities(filteredEntities, desugaredSortableByField)
	}, [desugaredSortableByField, entityList])

	const addNewAtIndex = React.useCallback<SortedEntities['addNewAtIndex']>(
		(index: number, preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void) => {
			if (!entityList.addNew) {
				return throwNonWritableError(entityList)
			}
			if (!desugaredSortableByField) {
				if (index === sortedEntities.length) {
					return entityList.addNew()
				}
				return throwNoopError('addNewAtIndex')
			}
			addNewEntityAtIndex(entityList, desugaredSortableByField, index, preprocess)
		},
		[desugaredSortableByField, entityList, sortedEntities.length],
	)
	const prependNew = React.useCallback<SortedEntities['prependNew']>(
		preprocess => {
			// TODO this may throw a confusing error about addNewAtIndex
			addNewAtIndex(0, preprocess)
		},
		[addNewAtIndex],
	)
	const appendNew = React.useCallback<SortedEntities['appendNew']>(
		preprocess => {
			// TODO this may throw a confusing error about addNewAtIndex
			addNewAtIndex(sortedEntities.length, preprocess)
		},
		[addNewAtIndex, sortedEntities.length],
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
		if (!entityList.batchUpdates || !desugaredSortableByField) {
			return
		}
		entityList.batchUpdates(getAccessor => {
			let listAccessor: EntityListAccessor = getAccessor()
			for (let i = 0, len = sortedEntities.length; i < len; i++) {
				const entity = sortedEntities[i]
				const orderField = entity.getRelativeSingleField(desugaredSortableByField)

				if (orderField.currentValue === null && orderField.updateValue) {
					orderField.updateValue(i)
					listAccessor = getAccessor()
				}
			}
		})
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
