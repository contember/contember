import { Accessor } from './Accessor'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

class EntityListAccessor extends Accessor implements Errorable {
	private _filteredEntities: EntityAccessor[] | undefined

	public constructor(
		private readonly entities: Map<
			string, // See EntityAccessor.key
			EntityListAccessor.ChildWithMetadata
		>,
		public readonly errors: ErrorAccessor[],
		public readonly addEventListener: EntityListAccessor.AddEntityEventListener,
		public readonly batchUpdates: (performUpdates: EntityListAccessor.BatchUpdates) => void,
		public readonly addNew:
			| ((newEntity?: EntityAccessor | ((getAccessor: () => EntityListAccessor, newKey: string) => void)) => void)
			| undefined,
	) {
		super()
	}

	/**
	 * ⚠ Important ⚠
	 * The indexes of the resulting array *MIGHT NOT* correspond to the indexes of the original entities array.
	 */
	public getFilteredEntities(): EntityAccessor[] {
		if (this._filteredEntities === undefined) {
			this._filteredEntities = Array.from(this.entities, ([, { accessor }]) => accessor).filter(
				(entity): entity is EntityAccessor => entity instanceof EntityAccessor,
			)
		}
		return [...this._filteredEntities]
	}

	public getByKey(key: string): EntityAccessor | EntityForRemovalAccessor | undefined {
		return this.entities.get(key)?.accessor
	}

	public *[Symbol.iterator](): Generator<EntityAccessor | EntityForRemovalAccessor> {
		for (const [, entity] of this.entities) {
			yield entity.accessor
		}
	}
}

namespace EntityListAccessor {
	export interface ChildWithMetadata {
		readonly accessor: EntityAccessor | EntityForRemovalAccessor
	}

	export type BatchUpdates = (getAccessor: () => EntityListAccessor) => void

	export interface EntityEventListenerMap {
		beforeUpdate: BatchUpdates
	}
	export type EntityEventType = keyof EntityEventListenerMap
	export interface AddEntityEventListener {
		(type: EntityEventType & 'beforeUpdate', listener: EntityEventListenerMap['beforeUpdate']): () => void
	}
}

export { EntityListAccessor }
