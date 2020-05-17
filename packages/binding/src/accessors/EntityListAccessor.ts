import { Accessor } from './Accessor'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { GetEntityByKey } from './GetEntityByKey'

class EntityListAccessor extends Accessor implements Errorable {
	private _filteredEntities: EntityAccessor[] | undefined

	public constructor(
		public readonly getEntityByKey: GetEntityByKey,
		private readonly entityIds: Set<string>, // See EntityAccessor.key
		public readonly errors: ErrorAccessor[],
		public readonly addEventListener: EntityListAccessor.AddEntityListEventListener,
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
			this._filteredEntities = Array.from(this.entityIds, this.getEntityByKey).filter(
				(entity): entity is EntityAccessor => entity instanceof EntityAccessor,
			)
		}
		return [...this._filteredEntities]
	}

	public *[Symbol.iterator](): Generator<EntityAccessor | EntityForRemovalAccessor> {
		for (const id of this.entityIds) {
			const accessor = this.getEntityByKey(id)
			if (!accessor) {
				continue
			}
			yield accessor
		}
	}
}

namespace EntityListAccessor {
	export type BatchUpdates = (getAccessor: () => EntityListAccessor) => void
	export type AfterUpdate = (accessor: EntityListAccessor) => void

	export interface EntityListEventListenerMap {
		beforeUpdate: BatchUpdates
		afterUpdate: AfterUpdate
	}
	export type EntityListEventType = keyof EntityListEventListenerMap
	export interface AddEntityListEventListener {
		(type: 'beforeUpdate', listener: EntityListEventListenerMap['beforeUpdate']): () => void
		(type: 'afterUpdate', listener: EntityListEventListenerMap['afterUpdate']): () => void
	}
}

export { EntityListAccessor }
