import type { ListOperations } from '../core/operations'
import type { Environment } from '../dao'
import type { EntityId, EntityRealmKey } from '../treeParameters'
import type { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'
import type { BatchUpdatesOptions } from './BatchUpdatesOptions'
import type { EntityAccessor } from './EntityAccessor'
import type { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import type { PersistErrorOptions } from './PersistErrorOptions'
import type { PersistSuccessOptions } from './PersistSuccessOptions'
import type { EntityListState } from '../core/state'
import { RuntimeId } from '../accessorTree'

class EntityListAccessor implements Errorable {
	public constructor(
		private readonly stateKey: EntityListState,
		private readonly operations: ListOperations,
		private readonly _children: ReadonlyMap<EntityId, { getAccessor: EntityAccessor.GetEntityAccessor }>,
		private readonly _idsPersistedOnServer: ReadonlySet<EntityId>,
		public readonly hasUnpersistedChanges: boolean,
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
	public get idsPersistedOnServer(): Set<EntityId> {
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

	public hasEntityOnServer(entityOrItsId: EntityAccessor | EntityId): boolean {
		if (typeof entityOrItsId === 'string' || typeof entityOrItsId === 'number') {
			return this.idsPersistedOnServer.has(entityOrItsId)
		}
		const idOnServer = entityOrItsId.idOnServer
		if (idOnServer === undefined) {
			return false
		}
		return this.idsPersistedOnServer.has(idOnServer)
	}

	public deleteAll(): void {
		this.batchUpdates(getAccessor => {
			const list = getAccessor()
			for (const entity of list) {
				entity.deleteEntity()
			}
		})
	}

	public disconnectAll(): void {
		this.batchUpdates(getAccessor => {
			const list = getAccessor()
			for (const entity of list) {
				list.disconnectEntity(entity)
			}
		})
	}

	public addError(error: ErrorAccessor.Error | string): () => void {
		return this.operations.addError(this.stateKey, ErrorAccessor.normalizeError(error))
	}

	public addEventListener<Type extends keyof EntityListAccessor.RuntimeEntityListEventListenerMap>(
		event: { type: Type; key?: string },
		listener: EntityListAccessor.RuntimeEntityListEventListenerMap[Type],
	) {
		return this.operations.addEventListener(this.stateKey, event, listener)
	}

	public addChildEventListener<Type extends keyof EntityAccessor.EntityEventListenerMap>(
		state: EntityListState,
		event: { type: Type; key?: string },
		listener: EntityAccessor.EntityEventListenerMap[Type],
	) {
		return this.operations.addChildEventListener(this.stateKey, event, listener)
	}

	public batchUpdates(performUpdates: EntityListAccessor.BatchUpdatesHandler): void {
		this.operations.batchUpdates(this.stateKey, performUpdates)
	}

	public connectEntity(entityToConnect: EntityAccessor): void {
		this.operations.connectEntity(this.stateKey, entityToConnect)
	}

	public createNewEntity(initialize?: EntityAccessor.BatchUpdatesHandler): RuntimeId {
		return this.operations.createNewEntity(this.stateKey, initialize)
	}
	public disconnectEntity(childEntity: EntityAccessor, options: { noPersist?: boolean } = {}): void {
		this.operations.disconnectEntity(this.stateKey, childEntity, options)
	}
	public getChildEntityById(id: EntityId): EntityAccessor {
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

	export interface RuntimeEntityListEventListenerMap {
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
