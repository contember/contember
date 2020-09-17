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
	const order = computeEntityOrder(sortEntities(Array.from(entityList), sortByField), sortByField, oldIndex, newIndex)
	entityList.batchUpdates((getAccessor: () => EntityListAccessor) => {
		let listAccessor: EntityListAccessor = getAccessor()
		for (const entity of listAccessor) {
			if (!(entity instanceof EntityAccessor)) {
				continue
			}
			const target = order.get(entity.key)
			const orderField = entity.getRelativeSingleField<number>(sortByField)

			if (target !== undefined) {
				orderField.updateValue(target)
				listAccessor = getAccessor()
			}
		}
	})
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

		if (typeof orderField.currentValue !== 'number' || orderField.currentValue !== targetValue) {
			order.set(entity.key, targetValue)
		}
	}
	return order
}
