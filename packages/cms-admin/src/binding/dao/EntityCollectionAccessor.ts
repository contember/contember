import { Accessor } from './Accessor'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

export class EntityCollectionAccessor extends Accessor implements Errorable {
	public constructor(
		public readonly entities: Array<EntityAccessor | EntityForRemovalAccessor | undefined>, // Undefined is a "hole" after an non-persisted entity
		public readonly errors: ErrorAccessor[],
		public readonly batchUpdates?: (performUpdates: (getAccessor: () => EntityCollectionAccessor) => void) => void,
		public readonly addNew?: (
			newEntity?: EntityAccessor | ((getAccessor: () => EntityCollectionAccessor, newIndex: number) => void),
		) => void,
	) {
		super()
	}

	findByKey(key: string): EntityAccessor | EntityForRemovalAccessor | undefined {
		return this.entities.find(e => e !== undefined && e.getKey() === key)
	}
}
