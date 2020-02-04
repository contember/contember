import { EntityAccessor, EntityListAccessor } from '../accessors'
import { RelativeSingleField } from '../treeParameters'
import { throwNonWritableError } from './errors'
import { moveEntity } from './moveEntity'

export const addNewEntityAtIndex = (
	entityList: EntityListAccessor,
	sortableByField: RelativeSingleField,
	index: number,
	preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void,
) => {
	if (!entityList.addNew) {
		return throwNonWritableError(entityList)
	}
	entityList.addNew((getListAccessor, newIndex) => {
		let accessor = getListAccessor()
		let newlyAdded = accessor.entities[newIndex]

		if (!(newlyAdded instanceof EntityAccessor)) {
			return
		}

		const sortableField = newlyAdded.getRelativeSingleField<number>(sortableByField)

		if (sortableField.updateValue) {
			sortableField.updateValue(newIndex)
		} else {
			return throwNonWritableError(sortableField.fieldName)
		}

		accessor = getListAccessor()
		newlyAdded = accessor.entities[newIndex]

		if (!(newlyAdded instanceof EntityAccessor)) {
			return
		}

		moveEntity(accessor, sortableByField, newIndex, index)

		preprocess && preprocess(getListAccessor, newIndex)
	})
}
