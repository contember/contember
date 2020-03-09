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

	public get runtimeId() {
		return this.entityAccessor.runtimeId
	}

	public isPersisted(): boolean {
		return true
	}

	public get primaryKey() {
		// The underlying entity is definitely persisted
		return this.entityAccessor.primaryKey as string
	}

	public get key() {
		return this.entityAccessor.key
	}

	public get typename() {
		return this.entityAccessor.typename
	}
}
