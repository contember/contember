import { RemovalType } from '../treeParameters'
import { Accessor } from './Accessor'
import { EntityAccessor } from './EntityAccessor'

export class EntityForRemovalAccessor extends Accessor {
	public readonly getField: EntityAccessor['getField']

	public constructor(
		public readonly entityAccessor: EntityAccessor,
		public readonly replaceBy: ((replacement: EntityAccessor) => void) | undefined,
		public readonly removalType: RemovalType,
	) {
		super()
		this.getField = this.entityAccessor.getField
	}

	public isPersisted(): boolean {
		return true
	}

	public getKey() {
		return this.entityAccessor.primaryKey
	}

	public getPersistedKey() {
		return this.entityAccessor.primaryKey
	}

	public get primaryKey() {
		return this.entityAccessor.primaryKey
	}

	public get typename() {
		return this.entityAccessor.typename
	}
}
