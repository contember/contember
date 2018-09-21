import EntityAccessor from './EntityAccessor'
import EntityMarker from './EntityMarker'


export default class EntityCollectionAccessor {
	public constructor(
		public readonly entities: Array<EntityAccessor | undefined>,
		public readonly appendNew?: () => void,
		public readonly prototype?: EntityMarker,
	) {}
}
