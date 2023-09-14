import { EntityAccessor, RelativeSingleField } from '@contember/binding'

export const sortEntities = (
	entities: EntityAccessor[],
	sortByField: RelativeSingleField | undefined,
): EntityAccessor[] => {
	if (!sortByField) {
		return entities
	}
	return entities.sort((a, b) => {
		const aField = a.getRelativeSingleField<number>(sortByField)
		const bField = b.getRelativeSingleField<number>(sortByField)

		if (typeof aField.value === 'number' && typeof bField.value === 'number') {
			return aField.value - bField.value
		}
		return 0
	})
}
