import { EntityAccessor, EntityId, EntityListAccessor, EntityListSubTreeMarker,
	EntityRealmKey, Environment, ErrorAccessor, EventListenersStore, RuntimeId } from '@contember/binding-common'
import { Entity } from '../entities/Entity'
import { ErrorSet } from '../ErrorSet'
import { EntityAccessorStore } from './EntityAccessorStore'
import { ChildEntityAccessor } from './entityAccessors/ChildEntityAccessor'

export class EntityListSubTreeAccessor implements EntityListAccessor {
	readonly __type = 'EntityListAccessor' as const

	#entities: Set<Entity> = new Set()
	#persistedEntities: Set<Entity> = new Set()
	#marker: EntityListSubTreeMarker

	#errors: ErrorSet | undefined

	#eventStore: EventListenersStore<EntityListAccessor.EntityListEventListenerMap> | undefined
	#childEventStore: EventListenersStore<EntityAccessor.EntityEventListenerMap> | undefined

	constructor(
		marker: EntityListSubTreeMarker,
		private readonly entityAccessorStore: EntityAccessorStore,
	) {
		this.#marker = marker
		this.#eventStore = marker.parameters.eventListeners?.clone()
		this.#childEventStore = marker.parameters.childEventListeners?.clone()
	}

	setMarker(marker: EntityListSubTreeMarker): void {
		if (marker.placeholderName !== this.#marker.placeholderName) {
			throw new Error('Cannot change placeholder name')
		}
		this.#marker = marker
	}

	setEntities(entities: Entity[]): void {
		this.#entities = new Set(entities)
		this.#persistedEntities = new Set(entities)
	}

	getAccessor: EntityListAccessor.GetEntityListAccessor = () => {
		return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
	}

	get environment(): Environment {
		return this.#marker.environment
	}

	get name(): string {
		return this.#marker.parameters.entityName
	}

	get hasUnpersistedChanges(): boolean {
		// todo optimize
		for (const entity of this.#entities) {
			if (entity.hasUnpersistedChanges) {
				return true
			}
		}
		return false
	}

	get errors(): ErrorAccessor | undefined {
		return this.#errors?.errors
	}

	addError(error: ErrorAccessor.Error): ErrorAccessor.ClearError {
		this.#errors ??= new ErrorSet()
		return this.#errors.addError(error)
	}

	clearErrors(): void {
		this.#errors?.clearErrors()
	}
	/**
	 * Returns all entity keys that are on the list.
	 * **KEYS ARE NOT IDS!**
	 * @see EntityAccessor.key
	 */
	*keys(): IterableIterator<EntityRealmKey> {
		// todo optimize
		for (const entity of this) {
			yield entity.key
		}
	}

	*ids(): IterableIterator<EntityId> {
		// todo optimize
		for (const entity of this.#entities) {
			yield entity.id.value
		}
	}

	get idsPersistedOnServer(): Set<EntityId> {
		return new Set(Array.from(this.#persistedEntities).map(it => it.id.value))
	}

	* [Symbol.iterator](): IterableIterator<EntityAccessor> {
		for (const entity of this.#entities) {
			const key = `list-${this.#marker.placeholderName}-${entity.globalKey}`

			yield this.entityAccessorStore.getOrCreateEntityByKey(key, () => new ChildEntityAccessor(
				key,
				entity.schema,
				entity,
				this.#marker.environment,
				this.#marker,
				this,
				new EventListenersStore(() => this.#childEventStore),
				this.entityAccessorStore,
			))
		}
	}

	hasEntityId = (id: EntityId): boolean => {
		// todo optimize
		for (const entity of this.#entities) {
			if (entity.id.value === id) {
				return true
			}
		}
		return false
	}

	isEmpty = (): boolean => {
		return this.#entities.size === 0
	}

	get length(): number {
		return this.#entities.size
	}

	hasEntityOnServer = (entityOrItsId: EntityAccessor | EntityId): boolean => {
		// todo implement
		throw new Error('not implemented')
	}

	deleteAll = (): void => {
		// todo implement
		throw new Error('not implemented')
	}

	disconnectAll = (): void => {
		// todo implement
		throw new Error('not implemented')
	}

	addEventListener: EntityListAccessor.AddEventListener = (event, listener) => {
		this.#eventStore ??= new EventListenersStore()
		return this.#eventStore.add(event, listener)
	}

	addChildEventListener: EntityListAccessor.AddChildEventListener = (event, listener) => {
		this.#childEventStore ??= new EventListenersStore()
		return this.#childEventStore.add(event, listener)
	}

	batchUpdates = (performUpdates: EntityListAccessor.BatchUpdatesHandler): void => {
		// todo implement
		throw new Error('not implemented')
	}

	connectEntity = (entityToConnect: EntityAccessor): void => {
		// todo implement
		throw new Error('not implemented')
	}

	createNewEntity = (initialize?: EntityAccessor.BatchUpdatesHandler): RuntimeId => {
		// todo implement
		throw new Error('not implemented')
	}

	disconnectEntity = (childEntity: EntityAccessor, options: { noPersist?: boolean } = {}): void => {
		// todo implement
		throw new Error('not implemented')
	}

	getChildEntityById = (id: EntityId): EntityAccessor => {
		// todo optimize
		for (const entity of this) {
			if (entity.id === id) {
				return entity
			}
		}
		throw new Error('Entity not found')
	}

	getParent = (): undefined => {
		return undefined
	}

	getMarker = (): EntityListSubTreeMarker => {
		return this.#marker
	}
}
