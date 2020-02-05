import { EntityAccessor } from '../accessors'
import { RelativeSingleField } from '../treeParameters'

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

		if (typeof aField.currentValue === 'number' && typeof bField.currentValue === 'number') {
			return aField.currentValue - bField.currentValue
		}
		return 0
	})
}
