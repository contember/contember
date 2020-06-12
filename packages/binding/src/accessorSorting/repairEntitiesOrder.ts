import { EntityAccessor, EntityListAccessor } from '../accessors'
import { RelativeSingleField } from '../treeParameters'

export const repairEntitiesOrder = (
	sortableByField: RelativeSingleField,
	entityList: EntityListAccessor,
	sortedEntities: EntityAccessor[],
) => {
	entityList.batchUpdates(() => {
		for (let i = 0, len = sortedEntities.length; i < len; i++) {
			const entity = sortedEntities[i]
			const orderField = entity.getRelativeSingleField(sortableByField)

			if (orderField.currentValue !== i) {
				// TODO ideally, this condition should just be `orderField.currentValue === null`
				// We should generally try to touch the indexes less
				orderField.updateValue?.(i)
			}
		}
	})
}
