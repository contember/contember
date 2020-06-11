import { RemovalType } from '../treeParameters/primitives'
import { Accessor } from './Accessor'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

class EntityListAccessor extends Accessor implements Errorable {
	private _filteredEntities: EntityAccessor[] | undefined

	public constructor(
		public readonly getEntityByKey: EntityListAccessor.GetEntityByKey,
		private readonly entityIds: Set<string>, // See EntityAccessor.key
		public readonly errors: ErrorAccessor[],
		public readonly addEventListener: EntityListAccessor.AddEntityListEventListener,
		public readonly batchUpdates: EntityListAccessor.BatchUpdates,
		public readonly disconnectEntity: EntityListAccessor.DisconnectEntity | undefined,
		public readonly addEntity: EntityListAccessor.AddEntity | undefined,
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
	export type AddEntity = (
		newEntity?: EntityAccessor | ((getAccessor: () => EntityListAccessor, newKey: string) => void),
	) => void
	export type BatchUpdates = (performUpdates: EntityListAccessor.BatchUpdatesHandler) => void
	export type BatchUpdatesHandler = (getAccessor: () => EntityListAccessor) => void
	export type DisconnectEntity = (key: string) => void
	export type GetEntityByKey = (key: string) => EntityAccessor | EntityForRemovalAccessor
	export type UpdateListener = (accessor: EntityListAccessor) => void

	export interface EntityListEventListenerMap {
		beforeUpdate: BatchUpdatesHandler
		update: UpdateListener
	}
	export type EntityListEventType = keyof EntityListEventListenerMap
	export interface AddEntityListEventListener {
		(type: 'beforeUpdate', listener: EntityListEventListenerMap['beforeUpdate']): () => void
		(type: 'update', listener: EntityListEventListenerMap['update']): () => void
	}
}

export { EntityListAccessor }
