import { sortEntities } from './sortEntities'
import { EntityAccessor, EntityListAccessor, RelativeSingleField } from '@contember/binding'

export const moveEntity = (
	entityList: EntityListAccessor,
	sortByField: RelativeSingleField,
	oldIndex: number,
	newIndex: number,
) => {
	moveEntityInArray(Array.from(entityList), entityList.getAccessor, sortByField, oldIndex, newIndex)
}

export const moveEntityInArray = (
	entities: EntityAccessor[],
	getAccessor: EntityListAccessor.GetEntityListAccessor,
	sortByField: RelativeSingleField,
	oldIndex: number,
	newIndex: number,
): EntityAccessor[] => {
	const sorted = sortEntities(entities, sortByField)
	const order = computeEntityOrder(sorted, sortByField, oldIndex, newIndex)

	getAccessor().batchUpdates((getAccessor, { getEntityByKey }) => {
		for (const [entityKey, newOrderValue] of order) {
			const targetEntity = getEntityByKey(entityKey)
			const orderField = targetEntity.getRelativeSingleField<number>(sortByField)

			orderField.updateValue(newOrderValue)
		}
	})
	return sorted
}

type EntityOrder = Map<string, number>

const computeEntityOrder = (
	entities: EntityAccessor[],
	sortByField: RelativeSingleField,
	oldIndex: number,
	newIndex: number,
): EntityOrder => {
	const order: EntityOrder = new Map()

	for (let i = 0, len = entities.length; i < len; i++) {
		const entity = entities[i]
		const orderField = entity.getRelativeSingleField<number>(sortByField)

		let targetValue

		if (i === oldIndex) {
			targetValue = newIndex
		} else if (newIndex > oldIndex && oldIndex < i && i <= newIndex) {
			targetValue = i - 1
		} else if (newIndex < oldIndex && newIndex <= i && i < oldIndex) {
			targetValue = i + 1
		} else {
			targetValue = i
		}

		if (typeof orderField.value !== 'number' || orderField.value !== targetValue) {
			order.set(entity.key, targetValue)
		}
	}
	return order
}
