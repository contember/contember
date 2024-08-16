import { EntityAccessor, RelativeSingleField } from '@contember/binding'

export const repairEntitiesOrder = (sortableByField: RelativeSingleField, sortedEntities: EntityAccessor[]) => {
	for (let i = 0, len = sortedEntities.length; i < len; i++) {
		const entity = sortedEntities[i]
		const orderField = entity.getRelativeSingleField(sortableByField)

		if (orderField.value !== i) {
			// TODO ideally, this condition should just be `orderField.value === null`
			// We should generally try to touch the indexes less
			orderField.updateValue(i)
		}
	}
}
