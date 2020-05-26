import { RemovalType } from '../treeParameters/primitives'
import { Accessor } from './Accessor'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

class EntityListAccessor extends Accessor implements Errorable {
	private _filteredEntities: EntityAccessor[] | undefined

	public constructor(
		public readonly getEntityByKey: (key: string) => EntityAccessor | EntityForRemovalAccessor,
		private readonly entityIds: Set<string>, // See EntityAccessor.key
		public readonly errors: ErrorAccessor[],
		public readonly addEventListener: EntityListAccessor.AddEntityListEventListener,
		public readonly batchUpdates: (performUpdates: EntityListAccessor.BatchUpdates) => void,
		public readonly removeEntity: EntityListAccessor.RemoveEntity | undefined,
		public readonly addEntity:
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
			yield this.getEntityByKey(id)
		}
	}
}

namespace EntityListAccessor {
	export type BatchUpdates = (getAccessor: () => EntityListAccessor) => void
	export type UpdateListener = (accessor: EntityListAccessor) => void
	export type RemoveEntity = (key: string, removalType: RemovalType) => void

	export interface EntityListEventListenerMap {
		beforeUpdate: BatchUpdates
		update: UpdateListener
	}
	export type EntityListEventType = keyof EntityListEventListenerMap
	export interface AddEntityListEventListener {
		(type: 'beforeUpdate', listener: EntityListEventListenerMap['beforeUpdate']): () => void
		(type: 'update', listener: EntityListEventListenerMap['update']): () => void
	}
}

export { EntityListAccessor }
