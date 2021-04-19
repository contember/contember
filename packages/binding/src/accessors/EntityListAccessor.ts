import { ListOperations } from '../core/operations'
import { Environment } from '../dao'
import { EntityId, EntityRealmKey } from '../treeParameters'
import { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'
import { BatchUpdatesOptions } from './BatchUpdatesOptions'
import { EntityAccessor } from './EntityAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { PersistErrorOptions } from './PersistErrorOptions'
import { PersistSuccessOptions } from './PersistSuccessOptions'

class EntityListAccessor implements Errorable {
	public constructor(
		private readonly stateKey: any,
		private readonly operations: ListOperations,
		private readonly _children: ReadonlyMap<EntityId, { getAccessor: EntityAccessor.GetEntityAccessor }>,
		private readonly _idsPersistedOnServer: ReadonlySet<string>,
		public readonly errors: ErrorAccessor | undefined,
		public readonly environment: Environment,
		public readonly getAccessor: EntityListAccessor.GetEntityListAccessor,
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

	public addError(error: ErrorAccessor.SugaredValidationError): () => void {
		return this.operations.addError(this.stateKey, error)
	}

	public addEventListener(
		type: 'beforePersist',
		listener: EntityListAccessor.EntityListEventListenerMap['beforePersist'],
	): () => void
	public addEventListener(
		type: 'beforeUpdate',
		listener: EntityListAccessor.EntityListEventListenerMap['beforeUpdate'],
	): () => void
	public addEventListener(
		type: 'persistSuccess',
		listener: EntityListAccessor.EntityListEventListenerMap['persistSuccess'],
	): () => void
	public addEventListener(
		type: 'persistError',
		listener: EntityListAccessor.EntityListEventListenerMap['persistError'],
	): () => void
	public addEventListener(type: 'update', listener: EntityListAccessor.EntityListEventListenerMap['update']): () => void
	public addEventListener(
		type: 'childBeforeUpdate',
		listener: EntityAccessor.EntityEventListenerMap['beforeUpdate'],
	): () => void
	public addEventListener(
		type: 'childInitialize',
		listener: EntityAccessor.EntityEventListenerMap['initialize'],
	): () => void
	public addEventListener(type: 'childUpdate', listener: EntityAccessor.EntityEventListenerMap['update']): () => void
	public addEventListener(
		type:
			| keyof EntityListAccessor.RuntimeEntityListEventListenerMap
			| `child${Capitalize<EntityAccessor.EntityEventType>}`,
		...args: unknown[]
	): () => void {
		return this.operations.addEventListener(this.stateKey, type, ...args)
	}

	public batchUpdates(performUpdates: EntityListAccessor.BatchUpdatesHandler) {
		this.operations.batchUpdates(this.stateKey, performUpdates)
	}

	public connectEntity(entityToConnect: EntityAccessor) {
		this.operations.connectEntity(this.stateKey, entityToConnect)
	}

	public createNewEntity(initialize?: EntityAccessor.BatchUpdatesHandler) {
		this.operations.createNewEntity(this.stateKey, initialize)
	}
	public disconnectEntity(childEntity: EntityAccessor) {
		this.operations.disconnectEntity(this.stateKey, childEntity)
	}
	public getChildEntityById(id: EntityId) {
		return this.operations.getChildEntityById(this.stateKey, id)
	}
}

namespace EntityListAccessor {
	export type GetEntityListAccessor = () => EntityListAccessor
	export type BatchUpdatesHandler = (getAccessor: GetEntityListAccessor, options: BatchUpdatesOptions) => void

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
}

export { EntityListAccessor }
