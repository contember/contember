import { EntityAccessor } from './EntityAccessor'
import { EntityData } from './EntityData'

export class EntityForRemovalAccessor implements EntityAccessor {
	constructor(
		public readonly primaryKey: string,
		public readonly data: EntityData,
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
