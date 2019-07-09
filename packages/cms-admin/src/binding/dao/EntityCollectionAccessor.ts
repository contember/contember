import { Accessor } from './Accessor'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

export class EntityCollectionAccessor extends Accessor implements Errorable {
	public constructor(
		public readonly entities: Array<EntityAccessor | EntityForRemovalAccessor | undefined>, // Undefined is a "hole" after an non-persisted entity
		public readonly errors: ErrorAccessor[],
		public readonly addNew?: () => void
	) {
		super()
	}
}
