import { EntityAccessor, RelativeSingleField } from '@contember/binding'

export const sortEntities = (
	entities: EntityAccessor[],
	sortByField: RelativeSingleField | undefined,
): EntityAccessor[] => {
	if (!sortByField) {
		return entities
	}
	return entities.sort((a, b) => {
		const aField = a.getField<number>(sortByField)
		const bField = b.getField<number>(sortByField)

		return (aField.value ?? Number.MAX_SAFE_INTEGER) - (bField.value ?? Number.MAX_SAFE_INTEGER)
	})
}
