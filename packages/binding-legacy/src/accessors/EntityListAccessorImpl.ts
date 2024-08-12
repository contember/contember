import type { EntityListState } from '../core/state'
import type { ListOperations } from '../core/operations'
import { EntityAccessor, EntityId, EntityListSubTreeMarker, EntityName, EntityRealmKey, Environment, ErrorAccessor,
	HasManyRelationMarker, RuntimeId } from '@contember/binding-common'
import { EntityListAccessor } from '@contember/binding-common'

export class EntityListAccessorImpl implements EntityListAccessor {
	public readonly  __type = 'EntityListAccessor' as const

	public constructor(
		private readonly state: EntityListState,
		private readonly operations: ListOperations,
		public readonly name: EntityName,
		private readonly _children: ReadonlyMap<EntityId, { getAccessor: EntityAccessor.GetEntityAccessor }>,
		private readonly _idsPersistedOnServer: ReadonlySet<EntityId>,
		public readonly hasUnpersistedChanges: boolean,
		public readonly errors: ErrorAccessor | undefined,
		public readonly environment: Environment,
		public readonly getAccessor: EntityListAccessor.GetEntityListAccessor,
	) {
	}

	/**
	 * Returns all entity keys that are on the list.
	 * **KEYS ARE NOT IDS!**
	 * @see EntityAccessor.key
	 */
	public* keys(): IterableIterator<EntityRealmKey> {
		for (const accessor of this) {
			yield accessor.key
		}
	}

	public* ids(): IterableIterator<EntityId> {
		return this._children.keys()
	}

	/**
	 * This will only contain the ids that the server knows about. Not necessarily the ids that have been added on
	 * the list since the last server query.
	 */
	public get idsPersistedOnServer(): Set<EntityId> {
		return new Set(this._idsPersistedOnServer)
	}

	public* [Symbol.iterator](): IterableIterator<EntityAccessor> {
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
		return this.operations.addError(this.state, ErrorAccessor.normalizeError(error))
	}

	public addEventListener<Type extends keyof EntityListAccessor.RuntimeEntityListEventListenerMap>(
		event: { type: Type; key?: string },
		listener: EntityListAccessor.EntityListEventListenerMap[Type],
	) {
		return this.operations.addEventListener(this.state, event, listener)
	}

	public addChildEventListener<Type extends keyof EntityAccessor.EntityEventListenerMap>(
		event: { type: Type; key?: string },
		listener: EntityAccessor.EntityEventListenerMap[Type],
	) {
		return this.operations.addChildEventListener(this.state, event, listener)
	}

	public batchUpdates(performUpdates: EntityListAccessor.BatchUpdatesHandler): void {
		this.operations.batchUpdates(this.state, performUpdates)
	}

	public connectEntity(entityToConnect: EntityAccessor): void {
		this.operations.connectEntity(this.state, entityToConnect)
	}

	public createNewEntity(initialize?: EntityAccessor.BatchUpdatesHandler): RuntimeId {
		return this.operations.createNewEntity(this.state, initialize)
	}

	public disconnectEntity(childEntity: EntityAccessor, options: { noPersist?: boolean } = {}): void {
		this.operations.disconnectEntity(this.state, childEntity, options)
	}

	public getChildEntityById(id: EntityId): EntityAccessor {
		return this.operations.getChildEntityById(this.state, id)
	}

	public getParent(): EntityAccessor | undefined {
		return this.state.blueprint.parent?.getAccessor()
	}

	public getMarker(): EntityListSubTreeMarker | HasManyRelationMarker {
		return this.state.blueprint.marker
	}
}
