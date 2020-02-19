import { EntityAccessor, EntityListAccessor } from '../accessors'
import { RelativeSingleField } from '../treeParameters'
import { throwNonWritableError } from './errors'
import { repairEntitiesOrder } from './repairEntitiesOrder'
import { sortEntities } from './sortEntities'

export const addNewEntityAtIndex = (
	entityList: EntityListAccessor,
	sortableByField: RelativeSingleField,
	index: number,
	preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void,
) => {
	if (!entityList.addNew) {
		return throwNonWritableError(entityList)
	}
	const sortedEntities = sortEntities(entityList.getFilteredEntities(), sortableByField)
	entityList.addNew((getListAccessor, newIndex) => {
		let newlyAdded = getListAccessor().entities[newIndex]

		if (!(newlyAdded instanceof EntityAccessor)) {
			return
		}

		const sortableField = newlyAdded.getRelativeSingleField<number>(sortableByField)

		if (sortableField.updateValue) {
			sortableField.updateValue(index)
			newlyAdded = getListAccessor().entities[newIndex]

			if (!(newlyAdded instanceof EntityAccessor)) {
				return
			}

			sortedEntities.splice(index, 0, newlyAdded)
			repairEntitiesOrder(sortableByField, getListAccessor(), sortedEntities)
		} else {
			return throwNonWritableError(sortableField.fieldName)
		}

		preprocess && preprocess(getListAccessor, newIndex)
	})
}
