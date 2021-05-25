import type { EntityAccessor, EntityListAccessor } from '../accessors'
import type { RelativeSingleField } from '../treeParameters'
import { repairEntitiesOrder } from './repairEntitiesOrder'
import { sortEntities } from './sortEntities'

export const addEntityAtIndex = (
	entityList: EntityListAccessor,
	sortableByField: RelativeSingleField,
	index: number,
	preprocess?: EntityAccessor.BatchUpdatesHandler,
) => {
	const sortedEntities = sortEntities(Array.from(entityList), sortableByField)

	entityList.createNewEntity((getNewlyAdded, options) => {
		let newlyAdded = getNewlyAdded()

		const sortableField = newlyAdded.getRelativeSingleField<number>(sortableByField)

		sortableField.updateValue(index)
		newlyAdded = getNewlyAdded()

		sortedEntities.splice(index, 0, newlyAdded)
		repairEntitiesOrder(sortableByField, sortedEntities)

		preprocess?.(getNewlyAdded, options)
	})
}
