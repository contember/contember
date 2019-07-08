import { EntityAccessor } from './EntityAccessor'
import { EntityData } from './EntityData'
import { ErrorCollectionAccessor } from './ErrorCollectionAccessor'

export class EntityForRemovalAccessor implements EntityAccessor {
	constructor(
		public readonly primaryKey: string,
		public readonly typename: string | undefined,
		public readonly data: EntityData,
		public readonly errors: ErrorCollectionAccessor,
		public readonly replaceWith: (replacement: EntityAccessor) => void,
		public readonly removalType: EntityAccessor.RemovalType
	) {}

	public isPersisted(): boolean {
		return true
	}

	public getKey() {
		return this.primaryKey
	}

	public getPersistedKey() {
		return this.primaryKey
	}
}
