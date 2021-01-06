import { GraphQlBuilder } from '@contember/client'
import { BindingOperations, EntityAccessor, EntityListAccessor, ErrorAccessor, FieldAccessor } from '../accessors'
import { EntityFieldPersistedData, ServerGeneratedUuid, UnpersistedEntityKey } from '../accessorTree'
import { BindingError } from '../BindingError'
import { TYPENAME_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import {
	EntityFieldMarkersContainer,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	Marker,
	SubTreeMarker,
} from '../markers'
import {
	EntityCreationParameters,
	EntityListEventListeners,
	EntityListPreferences,
	FieldName,
	Scalar,
} from '../treeParameters'
import { assertNever } from '../utils'
import { AccessorErrorManager } from './AccessorErrorManager'
import { Config } from './Config'
import { DirtinessTracker } from './DirtinessTracker'
import { EventManager } from './EventManager'
import { EntityOperations, FieldOperations, ListOperations } from './operations'
import {
	EntityListState,
	EntityRealm,
	EntityRealmSet,
	EntityState,
	EntityStateStub,
	FieldState,
	RootStateNode,
	StateNode,
	StateType,
} from './state'
import { EntityRealmKey } from './state/EntityRealmKey'
import { EntityRealmParent } from './state/EntityRealmParent'
import { TreeParameterMerger } from './TreeParameterMerger'
import { TreeStore } from './TreeStore'

export class StateInitializer {
	private readonly fieldOperations: FieldOperations
	private readonly entityOperations: EntityOperations
	private readonly listOperations: ListOperations

	public constructor(
		private readonly accessorErrorManager: AccessorErrorManager,
		private readonly bindingOperations: BindingOperations,
		private readonly config: Config,
		private readonly dirtinessTracker: DirtinessTracker,
		private readonly eventManager: EventManager,
		private readonly treeStore: TreeStore,
	) {
		this.fieldOperations = new FieldOperations(this.dirtinessTracker, this.eventManager, this.treeStore)
		this.entityOperations = new EntityOperations(
			this.bindingOperations,
			this.dirtinessTracker,
			this.eventManager,
			this,
			this.treeStore,
		)
		this.listOperations = new ListOperations(
			this.bindingOperations,
			this.dirtinessTracker,
			this.entityOperations,
			this.eventManager,
			this,
			this.treeStore,
		)
	}

	public initializeSubTree(tree: SubTreeMarker): RootStateNode {
		let subTreeState: RootStateNode
		const persistedRootData = this.treeStore.subTreePersistedData.get(tree.placeholderName)

		if (tree.parameters.type === 'qualifiedEntityList' || tree.parameters.type === 'unconstrainedQualifiedEntityList') {
			const persistedEntityIds: Set<string> = persistedRootData instanceof Set ? persistedRootData : new Set()
			subTreeState = this.initializeEntityListState(
				undefined,
				tree.environment,
				tree.fields,
				tree.parameters.value,
				persistedEntityIds,
				tree.parameters.value,
			)
		} else {
			const id = persistedRootData instanceof ServerGeneratedUuid ? persistedRootData : new UnpersistedEntityKey()
			subTreeState = this.initializeEntityState(id, {
				environment: tree.environment,
				creationParameters: tree.parameters.value,
				markersContainer: tree.fields,
				initialEventListeners: tree.parameters.value,
				parent: undefined,
				realmKey: tree.placeholderName,
			})
		}
		this.treeStore.subTreeStates.set(tree.placeholderName, subTreeState)

		return subTreeState
	}

	public initializeEntityStateStub(id: EntityAccessor.RuntimeId, realms: EntityRealmSet): EntityStateStub {
		return {
			type: StateType.EntityStub,
			id,
			realms,
			getAccessor: () => {
				let entityState: EntityState | undefined

				this.eventManager.syncTransaction(() => {
					for (const [parent, realmsByParent] of realms) {
						for (const [realmKey, realm] of realmsByParent) {
							entityState = this.initializeEntityState(id, realm)
							if (parent) {
								switch (parent.type) {
									case StateType.Entity:
									case StateType.EntityList:
										parent.children.set(realmKey, entityState)
										break
									default:
										assertNever(parent)
								}
							}
						}
					}
				})
				if (entityState === undefined) {
					throw new BindingError(`Fatal error: failed to initialize the entity '${id.value}'.`)
				}
				entityState.hasStaleAccessor = true
				return entityState.getAccessor()
			},
		}
	}

	public initializeEntityState(id: EntityAccessor.RuntimeId, realm: EntityRealm): EntityState {
		const entityKey = id.value
		const existingEntityState = this.treeStore.entityStore.get(entityKey)

		if (existingEntityState !== undefined) {
			this.entityOperations.addEntityRealm(existingEntityState, realm)

			return existingEntityState
		}

		const entityState: EntityState = {
			type: StateType.Entity,
			batchUpdateDepth: 0,
			fieldsWithPendingConnectionUpdates: undefined,
			childrenWithPendingUpdates: undefined,
			errors: undefined,
			eventListeners: TreeParameterMerger.cloneSingleEntityEventListeners(realm.initialEventListeners?.eventListeners),
			children: new Map(),
			hasIdSetInStone: true,
			hasPendingUpdate: false,
			hasPendingParentNotification: false,
			hasStaleAccessor: true,
			id,
			isScheduledForDeletion: false,
			maidenKey: id instanceof UnpersistedEntityKey ? id.value : undefined,
			persistedData: this.treeStore.persistedEntityData.get(entityKey),
			plannedHasOneDeletions: undefined,
			realms: this.createRealmSet(realm.parent, realm.realmKey, realm),
			typeName: undefined,
			combinedCreationParameters: realm.creationParameters,
			combinedMarkersContainer: realm.markersContainer,
			combinedEnvironment: realm.environment,
			getAccessor: (() => {
				let accessor: EntityAccessor | undefined = undefined
				return () => {
					if (entityState.hasStaleAccessor || accessor === undefined) {
						entityState.hasStaleAccessor = false
						accessor = new EntityAccessor(
							entityState.id,
							entityState.typeName,

							// We're technically exposing more info in runtime than we'd like but that way we don't have to allocate and
							// keep in sync two copies of the same data. TS hides the extra info anyway.
							entityState.children,
							entityState.persistedData,
							entityState.errors,
							entityState.combinedEnvironment,
							entityState.addError,
							entityState.addEventListener,
							entityState.batchUpdates,
							entityState.connectEntityAtField,
							entityState.disconnectEntityAtField,
							entityState.deleteEntity,
						)
					}
					return accessor
				}
			})(),
			onChildUpdate: updatedState => {
				this.entityOperations.onChildUpdate(entityState, updatedState)
			},
			addError: error =>
				this.accessorErrorManager.addError(entityState, { type: ErrorAccessor.ErrorType.Validation, error }),
			addEventListener: (type: EntityAccessor.EntityEventType, ...args: unknown[]) => {
				return this.entityOperations.addEventListener(entityState, type, ...args)
			},
			batchUpdates: performUpdates => {
				this.entityOperations.batchUpdates(entityState, performUpdates)
			},
			connectEntityAtField: (fieldName, entityToConnectOrItsKey) => {
				this.entityOperations.connectEntityAtField(entityState, fieldName, entityToConnectOrItsKey)
			},
			disconnectEntityAtField: (fieldName, initializeReplacement) => {
				this.entityOperations.disconnectEntityAtField(entityState, fieldName, initializeReplacement)
			},
			deleteEntity: () => {
				this.entityOperations.deleteEntity(entityState)
			},
		}
		this.treeStore.entityStore.set(entityKey, entityState)

		const typeName = entityState.persistedData?.get(TYPENAME_KEY_NAME)

		if (typeof typeName === 'string') {
			entityState.typeName = typeName
		}
		if (realm.creationParameters.forceCreation && !id.existsOnServer) {
			this.dirtinessTracker.increment()
		}

		for (const [placeholderName, field] of realm.markersContainer.markers) {
			this.initializeEntityField(entityState, field, entityState.persistedData?.get(placeholderName))
		}

		this.eventManager.registerNewlyInitialized([entityState, realm])

		return entityState
	}

	private initializeEntityListState(
		parent: EntityState | undefined,
		environment: Environment,
		markersContainer: EntityFieldMarkersContainer,
		creationParameters: EntityCreationParameters & EntityListPreferences,
		persistedEntityIds: Set<string>,
		initialEventListeners: EntityListEventListeners | undefined,
	): EntityListState {
		const entityListState: EntityListState = {
			type: StateType.EntityList,
			creationParameters,
			markersContainer,
			persistedEntityIds,
			addEventListener: undefined as any,
			batchUpdateDepth: 0,
			children: new Map(),
			childrenWithPendingUpdates: undefined,
			environment,
			eventListeners: TreeParameterMerger.cloneEntityListEventListeners(initialEventListeners?.eventListeners),
			errors: undefined,
			plannedRemovals: undefined,
			hasPendingParentNotification: false,
			hasPendingUpdate: false,
			hasStaleAccessor: true,
			parent,
			getAccessor: (() => {
				let accessor: EntityListAccessor | undefined = undefined
				return () => {
					if (entityListState.hasStaleAccessor || accessor === undefined) {
						entityListState.hasStaleAccessor = false
						accessor = new EntityListAccessor(
							entityListState.children,
							entityListState.persistedEntityIds,
							entityListState.errors,
							entityListState.environment,
							entityListState.addError,
							entityListState.addEventListener,
							entityListState.batchUpdates,
							entityListState.connectEntity,
							entityListState.createNewEntity,
							entityListState.disconnectEntity,
							entityListState.getChildEntityByKey,
						)
					}
					return accessor
				}
			})(),
			onChildUpdate: updatedState => {
				this.listOperations.onChildUpdate(entityListState, updatedState)
			},
			addError: error =>
				this.accessorErrorManager.addError(entityListState, { type: ErrorAccessor.ErrorType.Validation, error }),
			batchUpdates: performUpdates => {
				this.listOperations.batchUpdates(entityListState, performUpdates)
			},
			connectEntity: entityToConnectOrItsKey => {
				this.listOperations.connectEntity(entityListState, entityToConnectOrItsKey)
			},
			createNewEntity: initialize => {
				this.listOperations.createNewEntity(entityListState, initialize)
			},
			disconnectEntity: childEntityOrItsKey => {
				this.listOperations.disconnectEntity(entityListState, childEntityOrItsKey)
			},
			getChildEntityByKey: key => {
				return this.listOperations.getChildEntityByKey(entityListState, key)
			},
		}
		entityListState.addEventListener = this.getAddEventListener(entityListState)

		const initialData: Set<string | undefined> =
			persistedEntityIds.size === 0
				? new Set(Array.from({ length: creationParameters.initialEntityCount }))
				: persistedEntityIds
		for (const entityId of initialData) {
			this.initializeListEntityStub(entityListState, entityId)
		}

		return entityListState
	}

	private initializeFieldState(
		parent: EntityState,
		placeholderName: FieldName,
		fieldMarker: FieldMarker,
		persistedValue: Scalar | undefined,
	): FieldState {
		const resolvedFieldValue = persistedValue ?? fieldMarker.defaultValue ?? null

		const fieldState: FieldState = {
			type: StateType.Field,
			fieldMarker,
			placeholderName,
			persistedValue,
			parent,
			value: resolvedFieldValue,
			addEventListener: undefined as any,
			eventListeners: {
				beforeUpdate: undefined,
				update: undefined,
			},
			errors: undefined,
			touchLog: undefined,
			hasPendingUpdate: false,
			hasUnpersistedChanges: false,
			hasStaleAccessor: true,
			getAccessor: (() => {
				let accessor: FieldAccessor | undefined = undefined
				return () => {
					if (fieldState.hasStaleAccessor || accessor === undefined) {
						fieldState.hasStaleAccessor = false
						accessor = new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
							fieldState.placeholderName,
							fieldState.value,
							fieldState.persistedValue === undefined ? null : fieldState.persistedValue,
							fieldState.fieldMarker.defaultValue,
							fieldState.errors,
							fieldState.hasUnpersistedChanges,
							fieldState.touchLog,
							fieldState.addError,
							fieldState.addEventListener,
							fieldState.updateValue,
						)
					}
					return accessor
				}
			})(),
			addError: error =>
				this.accessorErrorManager.addError(fieldState, { type: ErrorAccessor.ErrorType.Validation, error }),
			updateValue: (newValue, options) => {
				this.fieldOperations.updateValue(fieldState, newValue, options)
			},
		}
		fieldState.addEventListener = this.getAddEventListener(fieldState)
		return fieldState
	}

	public findChildPlaceholdersByState(containingState: EntityState, childState: StateNode) {
		const relevantPlaceholders = new Set<FieldName>()

		// All has one relations where this entity is present.
		for (const [placeholderName, candidateState] of containingState.children) {
			if (candidateState === childState) {
				relevantPlaceholders.add(placeholderName)
			}
		}

		return relevantPlaceholders
	}

	public initializeFromFieldMarker(
		entityState: EntityState,
		field: FieldMarker,
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		if (fieldDatum instanceof Set) {
			throw new BindingError(
				`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
					`Perhaps you wanted to use a <Repeater />?`,
			)
		} else if (fieldDatum instanceof ServerGeneratedUuid) {
			throw new BindingError(
				`Received a referenced entity where a single '${field.fieldName}' field was expected. ` +
					`Perhaps you wanted to use <HasOne />?`,
			)
		} else {
			const fieldState = this.initializeFieldState(entityState, field.placeholderName, field, fieldDatum)
			entityState.children.set(field.placeholderName, fieldState)
		}
	}

	public initializeFromHasOneRelationMarker(
		entityState: EntityState,
		field: HasOneRelationMarker,
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		const relation = field.relation

		if (fieldDatum instanceof Set) {
			throw new BindingError(
				`Received a collection of entities for field '${relation.field}' where a single entity was expected. ` +
					`Perhaps you wanted to use a <Repeater />?`,
			)
		} else if (fieldDatum instanceof ServerGeneratedUuid || fieldDatum === null || fieldDatum === undefined) {
			const entityId = fieldDatum instanceof ServerGeneratedUuid ? fieldDatum : new UnpersistedEntityKey()
			entityState.children.set(
				field.placeholderName,
				this.initializeEntityStateStub(
					entityId,
					this.createRealmSet(entityState, field.placeholderName, {
						creationParameters: field.relation,
						environment: field.environment,
						initialEventListeners: field.relation,
						markersContainer: field.fields,
						parent: entityState,
						realmKey: field.placeholderName,
					}),
				),
			)
		} else {
			throw new BindingError(
				`Received a scalar value for field '${relation.field}' where a single entity was expected.` +
					`Perhaps you meant to use a variant of <Field />?`,
			)
		}
	}

	public initializeFromHasManyRelationMarker(
		entityState: EntityState,
		field: HasManyRelationMarker,
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		const relation = field.relation

		if (fieldDatum === undefined || fieldDatum instanceof Set) {
			entityState.children.set(
				field.placeholderName,
				this.initializeEntityListState(
					entityState,
					field.environment,
					field.fields,
					relation,
					fieldDatum || new Set(),
					field.relation,
				),
			)
		} else if (typeof fieldDatum === 'object') {
			// Intentionally allowing `fieldDatum === null` here as well since this should only happen when a *hasOne
			// relation is unlinked, e.g. a Person does not have a linked Nationality.
			throw new BindingError(
				`Received a referenced entity for field '${relation.field}' where a collection of entities was expected.` +
					`Perhaps you wanted to use a <HasOne />?`,
			)
		} else {
			throw new BindingError(
				`Received a scalar value for field '${relation.field}' where a collection of entities was expected.` +
					`Perhaps you meant to use a variant of <Field />?`,
			)
		}
	}

	public initializeEntityField(
		entityState: EntityState,
		field: Marker,
		fieldDatum: EntityFieldPersistedData | undefined,
	): void {
		if (field instanceof FieldMarker) {
			this.initializeFromFieldMarker(entityState, field, fieldDatum)
		} else if (field instanceof HasOneRelationMarker) {
			this.initializeFromHasOneRelationMarker(entityState, field, fieldDatum)
		} else if (field instanceof HasManyRelationMarker) {
			this.initializeFromHasManyRelationMarker(entityState, field, fieldDatum)
		} else if (field instanceof SubTreeMarker) {
			// Do nothing: all sub trees have been hoisted and shouldn't appear here.
		} else {
			assertNever(field)
		}
	}

	private getAddEventListener(state: {
		eventListeners: {
			[eventType: string]: Set<Function> | undefined
		}
	}) {
		return (type: string, listener: Function) => {
			if (state.eventListeners[type] === undefined) {
				state.eventListeners[type] = new Set<never>()
			}
			state.eventListeners[type]!.add(listener as any)
			return () => {
				if (state.eventListeners[type] === undefined) {
					return // Throw an error? This REALLY should not happen.
				}
				state.eventListeners[type]!.delete(listener as any)
				if (state.eventListeners[type]!.size === 0) {
					state.eventListeners[type] = undefined
				}
			}
		}
	}

	public initializeListEntityStub(entityListState: EntityListState, entityId: string | undefined): EntityStateStub {
		const id = entityId ? new ServerGeneratedUuid(entityId) : new UnpersistedEntityKey()
		const stub = this.initializeEntityStateStub(
			id,
			this.createRealmSet(entityListState, id.value, this.createListEntityRealm(entityListState, id)),
		)
		entityListState.hasStaleAccessor = true
		entityListState.children.set(id.value, stub)

		return stub
	}

	private createRealmSet(parent: EntityRealmParent, key: EntityRealmKey, realm: EntityRealm): EntityRealmSet {
		return new Map([[parent, new Map([[key, realm]])]])
	}

	public createListEntityRealm(parent: EntityListState, id: UnpersistedEntityKey | ServerGeneratedUuid): EntityRealm {
		return {
			creationParameters: parent.creationParameters,
			environment: parent.environment,
			initialEventListeners: this.eventManager.getEventListenersForListEntity(parent),
			markersContainer: parent.markersContainer,
			parent: parent,
			realmKey: id.value,
		}
	}

	public changeEntityId(entityState: EntityState, newId: EntityAccessor.RuntimeId) {
		const previousKey = entityState.id.value
		const newKey = newId.value

		entityState.hasIdSetInStone = true
		entityState.id = newId
		this.treeStore.entityStore.delete(previousKey)
		this.treeStore.entityStore.set(newKey, entityState)

		for (const [parentState] of entityState.realms) {
			// We're touching the parents and not letting *their* onChildUpdate handle this because we really need
			// to make sure this gets processed which wouldn't happen if before the id change we had told the parent
			// about another update.
			if (parentState?.type === StateType.Entity) {
				const relevantPlaceholders = this.findChildPlaceholdersByState(parentState, entityState)
				this.eventManager.markPendingConnections(parentState, relevantPlaceholders)
			} else if (parentState?.type === StateType.EntityList) {
				// This is tricky. We need to change the key but at the same time preserve the order of the entities.
				// We find the index of this entity (knowing there's exactly one occurrence), then convert the children
				// to an array, perform the replacement and put the data back into the map, preserving its referential
				// identity.
				let childIndex = -1
				for (const [key] of parentState.children) {
					childIndex++
					if (key === previousKey) {
						break
					}
				}
				const childrenArray = Array.from(parentState.children)
				childrenArray[childIndex] = [newKey, entityState]

				parentState.children.clear()
				for (const [key, state] of childrenArray) {
					parentState.children.set(key, state)
				}
			}
		}
	}
}
