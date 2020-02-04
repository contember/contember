import { EntityAccessor, EntityListAccessor } from '../accessors'
import { RelativeSingleField } from '../treeParameters'
import { throwNonWritableError } from './errors'
import { sortEntities } from './sortEntities'

export const moveEntity = (
	entityList: EntityListAccessor,
	sortByField: RelativeSingleField,
	oldIndex: number,
	newIndex: number,
) => {
	const order = computeEntityOrder(
		sortEntities(entityList.getFilteredEntities(), sortByField),
		sortByField,
		oldIndex,
		newIndex,
	)
	if (!entityList.batchUpdates) {
		return throwNonWritableError(entityList)
	}
	entityList.batchUpdates((getAccessor: () => EntityListAccessor) => {
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
	})
}

interface EntityOrder {
	[primaryKey: string]: number
}

const computeEntityOrder = (
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
