import EntityAccessor from './EntityAccessor'
import EntityForRemovalAccessor from './EntityForRemovalAccessor'
import EntityMarker from './EntityMarker'


export default class EntityCollectionAccessor {
	public constructor(
		public readonly entities: Array<EntityAccessor | EntityForRemovalAccessor | undefined>,
		public readonly appendNew?: () => void,
		public readonly prototype?: EntityMarker,
	) {}
}
