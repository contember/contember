import { RemovalType } from '../treeParameters'
import { Accessor } from './Accessor'
import { EntityAccessor } from './EntityAccessor'
import { EntityData } from './EntityData'
import { ErrorAccessor } from './ErrorAccessor'

export class EntityForRemovalAccessor extends Accessor implements EntityAccessor {
	constructor(
		public readonly primaryKey: string,
		public readonly typename: string | undefined,
		public readonly data: EntityData,
		public readonly errors: ErrorAccessor[],
		public readonly replaceWith: ((replacement: EntityAccessor) => void) | undefined,
		public readonly removalType: RemovalType,
	) {
		super()
	}

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
