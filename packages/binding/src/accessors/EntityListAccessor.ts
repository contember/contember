import { Environment } from '../dao'
import { EntityId, EntityRealmKey, FieldName } from '../treeParameters'
import { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'
import { BatchUpdatesOptions } from './BatchUpdatesOptions'
import { EntityAccessor } from './EntityAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { PersistErrorOptions } from './PersistErrorOptions'
import { PersistSuccessOptions } from './PersistSuccessOptions'

class EntityListAccessor implements Errorable {
	public constructor(
		private readonly _children: ReadonlyMap<EntityId, { getAccessor: EntityAccessor.GetEntityAccessor }>,
		private readonly _idsPersistedOnServer: ReadonlySet<string>,
		public readonly errors: ErrorAccessor | undefined,
		public readonly environment: Environment,
		public readonly addError: EntityListAccessor.AddError,
		public readonly addEventListener: EntityListAccessor.AddEntityListEventListener,
		public readonly batchUpdates: EntityListAccessor.BatchUpdates,
		public readonly connectEntity: EntityListAccessor.ConnectEntity,
		public readonly createNewEntity: EntityListAccessor.CreateNewEntity,
		public readonly disconnectEntity: EntityListAccessor.DisconnectEntity,
		public readonly getChildEntityById: EntityListAccessor.GetChildEntityById,
	) {}

	/**
	 * Returns all entity keys that are on the list.
	 * **KEYS ARE NOT IDS!**
	 * @see EntityAccessor.key
	 */
	public *keys(): IterableIterator<EntityRealmKey> {
		for (const accessor of this) {
			yield accessor.key
		}
	}

	public *ids(): IterableIterator<EntityId> {
		return this._children.keys()
	}

	/**
	 * This will only contain the ids that the server knows about. Not necessarily the ids that have been added on
	 * the list since the last server query.
	 */
	public get idsPersistedOnServer(): Set<string> {
		return new Set(this._idsPersistedOnServer)
	}

	public *[Symbol.iterator](): IterableIterator<EntityAccessor> {
		for (const { getAccessor } of this._children.values()) {
			yield getAccessor()
		}
	}

	public hasEntityId(id: EntityId): boolean {
		return this._children.has(id)
	}

	public isEmpty(): boolean {
		return this.length === 0
	}

	public get length(): number {
		return this._children.size
	}

	public hasEntityOnServer(entityOrItsId: EntityAccessor | string): boolean {
		if (typeof entityOrItsId === 'string') {
			return this.idsPersistedOnServer.has(entityOrItsId)
		}
		const idOnServer = entityOrItsId.idOnServer
		if (idOnServer === undefined) {
			return false
		}
		return this.idsPersistedOnServer.has(idOnServer)
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
	export type GetEntityListAccessor = () => EntityListAccessor
	export type AddError = ErrorAccessor.AddError
	export type BatchUpdates = (performUpdates: EntityListAccessor.BatchUpdatesHandler) => void
	export type BatchUpdatesHandler = (getAccessor: GetEntityListAccessor, options: BatchUpdatesOptions) => void
	export type ConnectEntity = (entityToConnect: EntityAccessor) => void
	export type CreateNewEntity = (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	export type DisconnectEntity = (childEntity: EntityAccessor) => void
	export type GetChildEntityById = (key: string) => EntityAccessor
	export type UpdateListener = (accessor: EntityListAccessor) => void

	export type BeforePersistHandler = (
		getAccessor: GetEntityListAccessor,
		options: AsyncBatchUpdatesOptions,
	) => void | Promise<void | BeforePersistHandler>

	export type PersistErrorHandler = (
		getAccessor: GetEntityListAccessor,
		options: PersistErrorOptions,
	) => void | Promise<void>

	export type PersistSuccessHandler = (
		getAccessor: GetEntityListAccessor,
		options: PersistSuccessOptions,
	) => void | Promise<void | PersistSuccessHandler>

	export type ChildEventListenerMap = {
		[EventType in keyof Pick<EntityAccessor.EntityEventListenerMap, 'beforeUpdate' | 'initialize' | 'update'> &
			string as `child${Capitalize<EventType>}`]: EntityAccessor.EntityEventListenerMap[EventType]
	}

	export interface RuntimeEntityListEventListenerMap extends ChildEventListenerMap {
		beforePersist: BeforePersistHandler
		beforeUpdate: BatchUpdatesHandler
		persistError: PersistErrorHandler
		persistSuccess: PersistSuccessHandler
		update: UpdateListener
	}
	export interface EntityListEventListenerMap extends RuntimeEntityListEventListenerMap {
		initialize: BatchUpdatesHandler
	}
	export type EntityListEventType = keyof EntityListEventListenerMap
	export interface AddEntityListEventListener {
		(type: 'beforePersist', listener: EntityListEventListenerMap['beforePersist']): () => void
		(type: 'beforeUpdate', listener: EntityListEventListenerMap['beforeUpdate']): () => void
		(type: 'persistSuccess', listener: EntityListEventListenerMap['persistSuccess']): () => void
		(type: 'persistError', listener: EntityListEventListenerMap['persistError']): () => void
		(type: 'update', listener: EntityListEventListenerMap['update']): () => void

		(type: 'childBeforeUpdate', listener: EntityAccessor.EntityEventListenerMap['beforeUpdate']): () => void
		(type: 'childInitialize', listener: EntityAccessor.EntityEventListenerMap['initialize']): () => void
		(type: 'childUpdate', listener: EntityAccessor.EntityEventListenerMap['update']): () => void

		// It's too late to add this by the time the accessor exists…
		// (type: 'initialize', listener: EntityListEventListenerMap['initialize']): () => void
	}
}

export { EntityListAccessor }
