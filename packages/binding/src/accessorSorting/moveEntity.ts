import { EntityAccessor, EntityListAccessor } from '../accessors'
import { RelativeSingleField } from '../treeParameters'
import { sortEntities } from './sortEntities'

export const moveEntity = (
	entityList: EntityListAccessor,
	sortByField: RelativeSingleField,
	oldIndex: number,
	newIndex: number,
) => {
	moveEntityInArray(Array.from(entityList), entityList.batchUpdates, sortByField, oldIndex, newIndex)
}

export const moveEntityInArray = (
	entities: EntityAccessor[],
	batchUpdates: EntityListAccessor.BatchUpdates,
	sortByField: RelativeSingleField,
	oldIndex: number,
	newIndex: number,
): EntityAccessor[] => {
	const sorted = sortEntities(entities, sortByField)
	const order = computeEntityOrder(sorted, sortByField, oldIndex, newIndex)

	batchUpdates(getAccessor => {
		for (const [entityKey, newOrderValue] of order) {
			const targetEntity = getAccessor().getChildEntityByKey(entityKey)
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
