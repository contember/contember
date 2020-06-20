import { Accessor } from './Accessor'
import { EntityAccessor } from './EntityAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

class EntityListAccessor extends Accessor implements Errorable {
	public constructor(
		public readonly getChildEntityByKey: EntityListAccessor.GetChildEntityByKey,
		private readonly childEntityKeys: ReadonlySet<string>, // See EntityAccessor.key
		public readonly errors: ErrorAccessor[],
		public readonly hasUnpersistedChanges: boolean,
		public readonly addEventListener: EntityListAccessor.AddEntityListEventListener,
		public readonly batchUpdates: EntityListAccessor.BatchUpdates,
		public readonly connectEntity: EntityListAccessor.ConnectEntity | undefined,
		public readonly createNewEntity: EntityListAccessor.CreateNewEntity | undefined,
		public readonly disconnectEntity: EntityListAccessor.DisconnectEntity | undefined,
	) {
		super()
	}

	public *[Symbol.iterator](): Generator<EntityAccessor> {
		for (const id of this.childEntityKeys) {
			yield this.getChildEntityByKey(id)
		}
	}

	public hasEntityKey(childEntityKey: string): boolean {
		return this.childEntityKeys.has(childEntityKey)
	}
}

namespace EntityListAccessor {
	export type BatchUpdates = (performUpdates: EntityListAccessor.BatchUpdatesHandler) => void
	export type BatchUpdatesHandler = (getAccessor: () => EntityListAccessor) => void
	export type ConnectEntity = (entityToConnectOrItsKey: EntityAccessor | string) => void
	export type CreateNewEntity = (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	export type DisconnectEntity = (childEntityOrItsKey: EntityAccessor | string) => void
	export type GetChildEntityByKey = (key: string) => EntityAccessor
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
