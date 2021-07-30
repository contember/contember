import type { EntityAccessor } from '../accessors'

export interface SortedEntities {
	entities: EntityAccessor[]
	prependNew: (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	appendNew: (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	addNewAtIndex: (index: number, preprocess?: EntityAccessor.BatchUpdatesHandler) => void
	moveEntity: (oldIndex: number, newIndex: number) => void
}
