import { Environment } from '../dao'
import { BindingOperations } from './BindingOperations'
import { EntityAccessor } from './EntityAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { PersistErrorOptions } from './PersistErrorOptions'
import { PersistSuccessOptions } from './PersistSuccessOptions'

class EntityListAccessor implements Errorable {
	public constructor(
		private readonly children: ReadonlyMap<string, EntityListAccessor.EntityDatum>,
		private readonly keysPersistedOnServer: ReadonlySet<string>,
		public readonly errors: ErrorAccessor | undefined,
		public readonly environment: Environment,
		public readonly addError: EntityListAccessor.AddError,
		public readonly addEventListener: EntityListAccessor.AddEntityListEventListener,
		public readonly batchUpdates: EntityListAccessor.BatchUpdates,
		public readonly connectEntity: EntityListAccessor.ConnectEntity,
		public readonly createNewEntity: EntityListAccessor.CreateNewEntity,
		public readonly disconnectEntity: EntityListAccessor.DisconnectEntity,
		public readonly getChildEntityByKey: EntityListAccessor.GetChildEntityByKey,
	) {}

	public *[Symbol.iterator](): Generator<EntityAccessor> {
		for (const [, childDatum] of this.children) {
			yield childDatum.getAccessor()
		}
	}

	public hasEntityKey(childEntityKey: string): boolean {
		return this.children.has(childEntityKey)
	}

	public isEmpty(): boolean {
		return this.length === 0
	}

	public get length(): number {
		return this.children.size
	}

	public get keysOnServer(): Set<string> {
		return new Set(this.keysPersistedOnServer)
	}

	public hasEntityOnServer(entity: string | EntityAccessor): boolean {
		return this.keysPersistedOnServer.has(typeof entity === 'string' ? entity : entity.key)
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
	export interface EntityDatum {
		getAccessor(): EntityAccessor
	}

	export type GetEntityListAccessor = () => EntityListAccessor
	export type AddError = ErrorAccessor.AddError
	export type BatchUpdates = (performUpdates: EntityListAccessor.BatchUpdatesHandler) => void
	export type BatchUpdatesHandler = (getAccessor: GetEntityListAccessor, bindingOperations: BindingOperations) => void
	export type ConnectEntity = (entityToConnectOrItsKey: EntityAccessor | string) => void
	export type CreateNewEntity = (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	export type DisconnectEntity = (childEntityOrItsKey: EntityAccessor | string) => void
	export type GetChildEntityByKey = (key: string) => EntityAccessor
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
