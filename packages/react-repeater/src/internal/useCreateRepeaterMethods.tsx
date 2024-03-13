import { useMemo } from 'react'
import { arrayMove } from './arrayMove'

import { RepeaterMethods } from '../types'
import { BindingError, EntityAccessor, EntityListAccessor, RelativeSingleField } from '@contember/binding'
import { repairEntitiesOrder, sortEntities } from '@contember/react-binding'

export const useCreateRepeaterMethods = ({ accessor, sortableBy }: {
	accessor: EntityListAccessor,
	sortableBy: RelativeSingleField | undefined
}): RepeaterMethods => {
	const accessorGetter = accessor.getAccessor

	return useMemo<RepeaterMethods>(() => ({
		addItem: (index = 'last', preprocess) => {
			const entities = accessorGetter()
			if (!sortableBy) {
				if (index === 'last') {
					return entities.createNewEntity(preprocess)
				}
				throw new BindingError('Cannot add item at specific index without sortableBy field')
			}
			const sortedEntities = sortEntities(Array.from(entities), sortableBy)
			const resolvedIndex = (() => {
				switch (index) {
					case 'first':
						return 0
					case 'last':
						return sortedEntities.length
					default:
						return index
				}
			})()
			entities.createNewEntity((getEntity, options) => {
				const newSorted = sortedEntities.splice(resolvedIndex, 0, getEntity())
				repairEntitiesOrder(sortableBy, newSorted)
				preprocess?.(getEntity, options)
			})
		},
		moveItem: sortableBy ? (entity, index) => {
			if (!sortableBy) {
				throw new BindingError('Cannot move item without sortableBy field')
			}

			const entities = accessorGetter()
			const sortedEntities = sortEntities(Array.from(entities), sortableBy)
			const currentIndex = sortedEntities.findIndex(it => it.id === entity.id)
			if (currentIndex === -1) {
				throw new BindingError('Cannot move item that is not in the list')
			}
			const resolvedIndex = (() => {
				switch (index) {
					case 'first':
						return 0
					case 'last':
						return sortedEntities.length - 1
					case 'previous':
						return currentIndex - 1
					case 'next':
						return currentIndex + 1
					default:
						return index
				}
			})()
			const newSorted = arrayMove(sortedEntities, currentIndex, resolvedIndex)
			repairEntitiesOrder(sortableBy, newSorted)
		} : undefined,
		removeItem: (entity: EntityAccessor) => {
			if (sortableBy) {
				const entities = accessorGetter()
				const sortedEntities = sortEntities(Array.from(entities), sortableBy)
				const currentIndex = sortedEntities.findIndex(it => it.id === entity.id)
				if (currentIndex !== -1) {
					const newSorted = sortedEntities.splice(currentIndex, 1)
					repairEntitiesOrder(sortableBy, newSorted)
				}
			}
			entity.deleteEntity()
		},
	}), [accessorGetter, sortableBy])
}
