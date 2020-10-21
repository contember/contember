import { Environment } from '../dao'
import { BindingOperations } from './BindingOperations'
import { EntityAccessor } from './EntityAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

class EntityListAccessor implements Errorable {
	public constructor(
		private readonly children: ReadonlySet<EntityListAccessor.FieldDatum>,
		public readonly errors: ErrorAccessor[],
		public readonly environment: Environment,
		public readonly addEventListener: EntityListAccessor.AddEntityListEventListener,
		public readonly batchUpdates: EntityListAccessor.BatchUpdates,
		public readonly connectEntity: EntityListAccessor.ConnectEntity,
		public readonly createNewEntity: EntityListAccessor.CreateNewEntity,
		public readonly disconnectEntity: EntityListAccessor.DisconnectEntity,
		public readonly getChildEntityByKey: EntityListAccessor.GetChildEntityByKey,
	) {}

	public *[Symbol.iterator](): Generator<EntityAccessor> {
		for (const childDatum of this.children) {
			yield childDatum.getAccessor()
		}
	}

	public hasEntityKey(childEntityKey: string): boolean {
		// This is an absolutely awful, awful implementation.
		// We should probably just pass global binding operations to here as well.
		try {
			this.getChildEntityByKey(childEntityKey)
			return true
		} catch {
			return false
		}
	}

	public isEmpty(): boolean {
		return this.length === 0
	}

	public get length(): number {
		return this.children.size
	}

	public deleteAll() {
		this.batchUpdates(getAccessor => {
			const list = getAccessor()
			for (const entity of list) {
				entity.deleteEntity()
			}
		})
		return this
	}

	public disconnectAll() {
		this.batchUpdates(getAccessor => {
			const list = getAccessor()
			for (const entity of list) {
				list.disconnectEntity(entity)
			}
		})
		return this
	}
}

namespace EntityListAccessor {
	export interface FieldDatum {
		getAccessor(): EntityAccessor
	}

	export type BatchUpdates = (performUpdates: EntityListAccessor.BatchUpdatesHandler) => void
	export type BatchUpdatesHandler = (
		getAccessor: () => EntityListAccessor,
		bindingOperations: BindingOperations,
	) => void
	export type ConnectEntity = (entityToConnectOrItsKey: EntityAccessor | string) => void
	export type CreateNewEntity = (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	export type DisconnectEntity = (childEntityOrItsKey: EntityAccessor | string) => void
	export type GetChildEntityByKey = (key: string) => EntityAccessor
	export type UpdateListener = (accessor: EntityListAccessor) => void

	export interface EntityListEventListenerMap {
		beforePersist: BatchUpdatesHandler
		beforeUpdate: BatchUpdatesHandler
		childInitialize: EntityAccessor.BatchUpdatesHandler
		//childListUpdate: UpdateListener
		initialize: BatchUpdatesHandler
		update: UpdateListener
	}
	export type EntityListEventType = keyof EntityListEventListenerMap
	export interface AddEntityListEventListener {
		(type: 'beforePersist', listener: EntityListEventListenerMap['beforePersist']): () => void
		(type: 'beforeUpdate', listener: EntityListEventListenerMap['beforeUpdate']): () => void
		(type: 'childInitialize', listener: EntityListEventListenerMap['childInitialize']): () => void
		(type: 'initialize', listener: EntityListEventListenerMap['initialize']): () => void
		(type: 'update', listener: EntityListEventListenerMap['update']): () => void
	}
}

export { EntityListAccessor }
