import {
	EntityAccessor,
	EntityId,
	EntityListAccessor,
	EntityListSubTreeMarker,
	EntityRealmKey,
	Environment,
	ErrorAccessor,
	HasManyRelationMarker,
	RuntimeId,
	SchemaEntity,
} from '@contember/binding-common'

export class EntityListAccessorImpl implements EntityListAccessor {
	readonly  __type = 'EntityListAccessor' as const

	public constructor(
		private readonly schema: SchemaEntity,
		public readonly environment: Environment,
	) {
	}

	getAccessor: EntityListAccessor.GetEntityListAccessor = () => {
		return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
	}


	get name(): string {
		return this.schema.name
	}

	get hasUnpersistedChanges(): boolean {
		// todo implement
		throw new Error('not implemented')
	}

	get errors(): ErrorAccessor | undefined {
		// todo implement
		throw new Error('not implemented')
	}

	/**
	 * Returns all entity keys that are on the list.
	 * **KEYS ARE NOT IDS!**
	 * @see EntityAccessor.key
	 */
	 keys(): IterableIterator<EntityRealmKey> {
		// todo implement
		throw new Error('not implemented')
	}

	ids(): IterableIterator<EntityId> {
		// todo implement
		throw new Error('not implemented')

	}

	get idsPersistedOnServer(): Set<EntityId> {
		// todo implement
		throw new Error('not implemented')
	}

	*[Symbol.iterator](): IterableIterator<EntityAccessor> {
		// todo implement
		throw new Error('not implemented')
	}

	hasEntityId = (id: EntityId): boolean => {
		// todo implement
		throw new Error('not implemented')
	}

	isEmpty = (): boolean => {
		// todo implement
		throw new Error('not implemented')
	}

	get length(): number {
		// todo implement
		throw new Error('not implemented')
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

	addError = (error: ErrorAccessor.Error | string): () => void => {
		// todo implement
		throw new Error('not implemented')
	}

	addEventListener: EntityListAccessor.AddEventListener = () => {
		// todo implement
		throw new Error('not implemented')
	}

	addChildEventListener: EntityListAccessor.AddChildEventListener = () => {
		// todo implement
		throw new Error('not implemented')
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
		// todo implement
		throw new Error('not implemented')
	}

	getParent = (): EntityAccessor | undefined => {
		// todo implement
		throw new Error('not implemented')
	}

	getMarker = (): EntityListSubTreeMarker | HasManyRelationMarker => {
		// todo implement
		throw new Error('not implemented')
	}
}
