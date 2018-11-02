import EntityAccessor from './EntityAccessor'
import EntityForRemovalAccessor from './EntityForRemovalAccessor'

export default class EntityCollectionAccessor {
	public constructor(
		public readonly entities: Array<EntityAccessor | EntityForRemovalAccessor | undefined>, // Undefined is a "hole" after an non-persisted entity
		public readonly addNew?: () => void
	) {}
}
