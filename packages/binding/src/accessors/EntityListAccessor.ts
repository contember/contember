import { Environment } from '../dao'
import { BindingOperations } from './BindingOperations'
import { EntityAccessor } from './EntityAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { PersistErrorOptions } from './PersistErrorOptions'
import { PersistSuccessOptions } from './PersistSuccessOptions'

class EntityListAccessor implements Errorable {
	public constructor(
		private readonly _children: ReadonlyMap<string, { getAccessor: EntityAccessor.GetEntityAccessor }>,
		private readonly _idsPersistedOnServer: ReadonlySet<string>,
		private readonly _bindingOperations: BindingOperations,
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
	public *keys(): Generator<string> {
		for (const accessor of this) {
			yield accessor.key
		}
	}

	public *ids(): IterableIterator<string> {
		return this._children.keys()
	}

	/**
	 * This will only contain the ids that the server knows about. Not necessarily the ids that have been added on
	 * the list since the last server query.
	 */
	public get idsPersistedOnServer(): Set<string> {
		return new Set(this._idsPersistedOnServer)
	}

	public *[Symbol.iterator](): Generator<EntityAccessor> {
		for (const [, { getAccessor }] of this._children) {
			yield getAccessor()
		}
	}

	public hasEntityKey(childEntityKey: string): boolean {
		return this._children.has(childEntityKey)
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
	export type BatchUpdatesHandler = (getAccessor: GetEntityListAccessor, bindingOperations: BindingOperations) => void
	export type ConnectEntity = (entityToConnectOrItsKey: EntityAccessor | string) => void
	export type CreateNewEntity = (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	export type DisconnectEntity = (childEntityOrItsKey: EntityAccessor | string) => void
	export type GetChildEntityById = (key: string) => EntityAccessor
	export type UpdateListener = (accessor: EntityListAccessor) => void

	export type BeforePersistHandler = (
		getAccessor: GetEntityListAccessor,
		bindingOperations: BindingOperations,
	) => void | Promise<BeforePersistHandler>

	export type PersistErrorHandler = (
		getAccessor: GetEntityListAccessor,
		options: PersistErrorOptions,
	) => void | Promise<void>

	export type PersistSuccessHandler = (getAccessor: GetEntityListAccessor, options: PersistSuccessOptions) => void

	export interface EntityListEventListenerMap {
		beforePersist: BeforePersistHandler
		beforeUpdate: BatchUpdatesHandler
		childInitialize: EntityAccessor.BatchUpdatesHandler
		//childListUpdate: UpdateListener
		initialize: BatchUpdatesHandler
		persistError: PersistErrorHandler
		persistSuccess: PersistSuccessHandler
		update: UpdateListener
	}
	export type EntityListEventType = keyof EntityListEventListenerMap
	export interface AddEntityListEventListener {
		(type: 'beforePersist', listener: EntityListEventListenerMap['beforePersist']): () => void
		(type: 'beforeUpdate', listener: EntityListEventListenerMap['beforeUpdate']): () => void
		(type: 'childInitialize', listener: EntityListEventListenerMap['childInitialize']): () => void
		(type: 'update', listener: EntityListEventListenerMap['update']): () => void

		// It's too late to add this by the time the accessor exists…
		// (type: 'initialize', listener: EntityListEventListenerMap['initialize']): () => void
	}
}

export { EntityListAccessor }
