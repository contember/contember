import * as React from 'react'
import { EntityAccessor, EntityListAccessor } from '../accessors'
import { BindingError } from '../BindingError'
import { FieldName, RelativeSingleField, SugaredRelativeSingleField } from '../treeParameters'
import { useOptionalDesugaredRelativeSingleField } from './useOptionalDesugaredRelativeSingleField'

interface EntityOrder {
	[primaryKey: string]: number
}

export interface SortedEntities {
	entities: EntityAccessor[]
	prependNew: (preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void) => void
	appendNew: (preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void) => void
	addNewAtIndex: (index: number, preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void) => void
	moveEntity: (oldIndex: number, newIndex: number) => void
}

const throwNoopError = (callbackName: keyof SortedEntities) => {
	throw new BindingError(
		`Cannot invoke '${callbackName}' in non-sortable mode. The 'sortByField' parameter of the 'useSortedEntities' ` +
			`hook is undefined.`,
	)
}

const throwNonWritableError = (target: FieldName | EntityListAccessor) => {
	if (target instanceof EntityListAccessor) {
		throw new BindingError(`Trying to add a new entity to a list that is not writable.`)
	}
	throw new BindingError(`Trying to interactively sort by the '${target}' field but it is not writable.`)
}

const sortEntities = (entities: EntityAccessor[], sortByField: RelativeSingleField | undefined): EntityAccessor[] => {
	if (!sortByField) {
		return entities
	}
	return entities.sort((a, b) => {
		const aField = a.getRelativeSingleField<number>(sortByField)
		const bField = b.getRelativeSingleField<number>(sortByField)

		if (typeof aField.currentValue === 'number' && typeof bField.currentValue === 'number') {
			return aField.currentValue - bField.currentValue
		}
		return 0
	})
}

const computeNewEntityOrder = (
	entities: EntityAccessor[],
	sortByField: RelativeSingleField,
	oldIndex: number,
	newIndex: number,
): EntityOrder => {
	const order: EntityOrder = {}

	for (let i = 0, len = entities.length; i < len; i++) {
		const entity = entities[i]
		const orderField = entity.getRelativeSingleField<number>(sortByField)

		let targetValue

		if (i === oldIndex) {
			targetValue = newIndex
		} else if (oldIndex < newIndex && i > oldIndex && i <= newIndex) {
			targetValue = i - 1
		} else if (oldIndex > newIndex && i >= newIndex && i < oldIndex) {
			targetValue = i + 1
		} else {
			targetValue = i
		}

		if (typeof orderField.currentValue !== 'number' || orderField.currentValue !== targetValue) {
			order[entity.getKey()] = targetValue
		}
	}
	return order
}

const getBatchUpdater = (order: EntityOrder, sortByField: RelativeSingleField) => (
	getAccessor: () => EntityListAccessor,
) => {
	let listAccessor: EntityListAccessor = getAccessor()
	for (const entity of listAccessor.entities) {
		if (!(entity instanceof EntityAccessor)) {
			continue
		}
		const target = order[entity.getKey()]
		const orderField = entity.getRelativeSingleField<number>(sortByField)

		if (target !== undefined) {
			if (orderField.updateValue) {
				orderField.updateValue(target)
				listAccessor = getAccessor()
			} else {
				return throwNonWritableError(orderField.fieldName)
			}
		}
	}
}

const reconcileOrderFields = (
	entityList: EntityListAccessor,
	sortByField: RelativeSingleField,
	oldIndex: number,
	newIndex: number,
) => {
	const order = computeNewEntityOrder(
		sortEntities(entityList.getFilteredEntities(), sortByField),
		sortByField,
		oldIndex,
		newIndex,
	)
	if (!entityList.batchUpdates) {
		return throwNonWritableError(entityList)
	}
	entityList.batchUpdates(getBatchUpdater(order, sortByField))
}

export const useSortedEntities = (
	entityList: EntityListAccessor,
	sortByField: SugaredRelativeSingleField['field'] | undefined,
): SortedEntities => {
	const desugaredSortByField = useOptionalDesugaredRelativeSingleField(sortByField)
	const sortedEntities = React.useMemo(() => {
		const filteredEntities = entityList.getFilteredEntities()
		return sortEntities(filteredEntities, desugaredSortByField)
	}, [desugaredSortByField, entityList])

	const addNewAtIndex = React.useCallback<SortedEntities['addNewAtIndex']>(
		(index: number, preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void) => {
			if (!entityList.addNew) {
				return throwNonWritableError(entityList)
			}
			if (!desugaredSortByField) {
				if (index === sortedEntities.length) {
					return entityList.addNew()
				}
				return throwNoopError('addNewAtIndex')
			}
			entityList.addNew((getListAccessor, newIndex) => {
				let accessor = getListAccessor()
				let newlyAdded = accessor.entities[newIndex]

				if (!(newlyAdded instanceof EntityAccessor)) {
					return
				}

				const sortableField = newlyAdded.getRelativeSingleField<number>(desugaredSortByField)

				if (sortableField.updateValue) {
					sortableField.updateValue(newIndex)
				} else {
					return throwNonWritableError(sortableField.fieldName)
				}

				accessor = getListAccessor()
				newlyAdded = accessor.entities[newIndex]

				if (!(newlyAdded instanceof EntityAccessor)) {
					return
				}

				reconcileOrderFields(accessor, desugaredSortByField, newIndex, index)

				preprocess && preprocess(getListAccessor, newIndex)
			})
		},
		[desugaredSortByField, entityList, sortedEntities.length],
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
	const moveEntity = React.useCallback<SortedEntities['moveEntity']>(
		(oldIndex, newIndex) => {
			if (!desugaredSortByField) {
				return throwNoopError('moveEntity')
			}
			reconcileOrderFields(entityList, desugaredSortByField, oldIndex, newIndex)
		},
		[desugaredSortByField, entityList],
	)

	React.useEffect(() => {
		if (!entityList.batchUpdates || !desugaredSortByField) {
			return
		}
		entityList.batchUpdates(getAccessor => {
			let listAccessor: EntityListAccessor = getAccessor()
			for (let i = 0, len = sortedEntities.length; i < len; i++) {
				const entity = sortedEntities[i]
				const orderField = entity.getRelativeSingleField(desugaredSortByField)

				if (orderField.currentValue === null && orderField.updateValue) {
					orderField.updateValue(i)
					listAccessor = getAccessor()
				}
			}
		})
	}, [desugaredSortByField, entityList, sortedEntities])

	return React.useMemo<SortedEntities>(
		() => ({
			entities: sortedEntities,
			addNewAtIndex,
			appendNew,
			prependNew,
			moveEntity,
		}),
		[addNewAtIndex, appendNew, sortedEntities, moveEntity, prependNew],
	)
}
