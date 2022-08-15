import { BatchUpdatesOptions, EntityAccessor, EntityListAccessor, FieldAccessor } from '../accessors'
import { EntityFieldPersistedData, RuntimeId, ServerId, UnpersistedEntityDummyId } from '../accessorTree'
import { BindingError } from '../BindingError'
import {
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
} from '../markers'
import { BijectiveIndexedMap } from '../structures'
import type {
	EntityEventListenerStore,
	EntityId,
	EntityListEventListenerStore,
	EntityName,
	FieldEventListenerStore,
	FieldName,
	FieldValue,
} from '../treeParameters'
import { EventListenersStore } from '../treeParameters'
import { assertNever } from '../utils'
import type { AccessorErrorManager } from './AccessorErrorManager'
import type { EventManager } from './EventManager'
import { EntityOperations, FieldOperations, ListOperations } from './operations'
import { RealmKeyGenerator } from './RealmKeyGenerator'
import {
	EntityListBlueprint,
	EntityListState,
	EntityRealmBlueprint,
	EntityRealmState,
	EntityRealmStateStub,
	EntityState,
	FieldState,
	getEntityMarker,
	RootStateNode,
} from './state'
import { TreeParameterMerger } from './TreeParameterMerger'
import type { TreeStore } from './TreeStore'

export class StateInitializer {
	private readonly fieldOperations: FieldOperations
	private readonly entityOperations: EntityOperations
	private readonly listOperations: ListOperations

	public constructor(
		accessorErrorManager: AccessorErrorManager,
		batchUpdatesOptions: BatchUpdatesOptions,
		private readonly eventManager: EventManager,
		private readonly treeStore: TreeStore,
	) {
		this.fieldOperations = new FieldOperations(accessorErrorManager, this.eventManager, this, this.treeStore)
		this.entityOperations = new EntityOperations(accessorErrorManager, batchUpdatesOptions, this.eventManager, this, this.treeStore)
		this.listOperations = new ListOperations(accessorErrorManager, batchUpdatesOptions, this.eventManager, this, this.treeStore)
	}

	public initializeSubTree(tree: EntitySubTreeMarker | EntityListSubTreeMarker): RootStateNode {
		let subTreeState: RootStateNode
		const persistedRootData = this.treeStore.subTreePersistedData.get(tree.placeholderName)

		if (tree instanceof EntityListSubTreeMarker) {
			const persistedEntityIds: Set<EntityId> = persistedRootData instanceof Set ? persistedRootData : new Set()
			subTreeState = this.initializeEntityListState(
				{ marker: tree, parent: undefined },
				tree.entityName,
				persistedEntityIds,
			)
		} else {
			subTreeState = this.materializeEntityRealm(
				this.initializeEntityRealm(
					persistedRootData instanceof ServerId ? persistedRootData : new UnpersistedEntityDummyId(),
					tree.entityName,
					{
						type: 'subTree',
						marker: tree,
						parent: undefined,
					},
				),
			)
		}

		return subTreeState
	}

	public initializeEntityRealm(
		id: RuntimeId,
		entityName: EntityName,
		blueprint: EntityRealmBlueprint,
		copyFrom?: EntityRealmState | EntityRealmStateStub,
	): EntityRealmState | EntityRealmStateStub {
		// This is counter-intuitive a bit. The method can also return an EntityRealmState, not just a stub.
		// The reason is so that each call-site can just default to trying to initialize a stub without having to keep
		// in mind that the realm might have already been initialized.

		const entity = this.initializeEntityState(id, entityName)
		const realmKey = RealmKeyGenerator.getRealmKey(id, blueprint)

		const existing = this.treeStore.entityRealmStore.get(realmKey)
		if (existing !== undefined) {
			return existing
		}

		if (!copyFrom || copyFrom.type !== 'entityRealm') {
			const stub: EntityRealmStateStub = {
				type: 'entityRealmStub',

				blueprint,
				entity,
				realmKey,
				getAccessor: () => this.materializeEntityRealm(stub).getAccessor(),
			}
			this.registerEntityRealm(stub)

			return stub
		}
		const realm = this.createEntityRealm(blueprint, realmKey, entity, copyFrom)

		this.registerEntityRealm(realm)

		const marker = getEntityMarker(realm)
		const pathBack = this.treeStore.getPathBackToParent(realm)

		for (const [placeholderName, field] of marker.fields.markers) {
			if (field instanceof FieldMarker) {
				const value = copyFrom.children.get(placeholderName)
				if (!value || value.type !== 'field') {
					throw new BindingError()
				}
				this.initializeFromFieldMarker(realm, field, undefined, value)
			} else if (field instanceof HasManyRelationMarker) {
				const value = copyFrom.children.get(placeholderName)
				if (!value || value.type !== 'entityList') {
					throw new BindingError()
				}
				this.initializeFromHasManyRelationMarker(realm, field, new Set(value.children.keys()))
			} else if (field instanceof HasOneRelationMarker) {
				let runtimeId: RuntimeId
				let subCopyFrom: EntityRealmState | undefined = undefined
				if (pathBack?.fieldBackToParent === field.parameters.field) {
					runtimeId = pathBack.parent.entity.id
				} else {
					const value = copyFrom.children.get(placeholderName)
					if (!value || (value.type !== 'entityRealm' && value.type !== 'entityRealmStub')) {
						throw new BindingError()
					}
					runtimeId = !(value.entity.id instanceof UnpersistedEntityDummyId) ? value.entity.id : new UnpersistedEntityDummyId()
					if (value.type === 'entityRealm') {
						subCopyFrom = value
					}
				}
				this.initializeFromHasOneRelationMarker(realm, field, runtimeId, subCopyFrom)
			} else {
				assertNever(field)
			}
		}

		this.eventManager.registerNewlyInitialized(realm)
		return realm
	}

	private createEntityRealm(
		blueprint: EntityRealmBlueprint,
		realmKey: string,
		entity: EntityState,
		copyFrom?: EntityRealmState,
	): EntityRealmState {
		const entityRealm: EntityRealmState = {
			type: 'entityRealm',

			blueprint,
			realmKey,
			entity,

			accessor: undefined,
			children: new Map(),
			childrenWithPendingUpdates: undefined,
			errors: undefined,
			eventListeners: this.initializeEntityEventListenerStore(blueprint),
			fieldsWithPendingConnectionUpdates: undefined,
			plannedHasOneDeletions: undefined,
			unpersistedChangesCount: copyFrom?.unpersistedChangesCount ?? 0,
			getAccessor: () => {
				if (entityRealm.accessor === undefined) {
					const entity = entityRealm.entity
					entityRealm.accessor = new EntityAccessor(
						entityRealm,
						this.entityOperations,
						entity.id,
						entityRealm.realmKey,
						entity.entityName,

						// We're technically exposing more info in runtime than we'd like but that way we don't have to allocate and
						// keep in sync two copies of the same data. TS hides the extra info anyway.
						entityRealm.children,
						this.treeStore.persistedEntityData.get(entity.id.uniqueValue),
						entityRealm.unpersistedChangesCount !== 0,
						entityRealm.errors,
						getEntityMarker(entityRealm).environment,
						entityRealm.getAccessor,
					)
				}
				return entityRealm.accessor
			},
		}
		return entityRealm
	}

	private materializeEntityRealm(state: EntityRealmState | EntityRealmStateStub): EntityRealmState {
		if (state.type === 'entityRealm') {
			return state
		}
		const { realmKey, entity, blueprint } = state

		const existing = this.treeStore.entityRealmStore.get(realmKey)
		if (existing !== undefined && existing.type === 'entityRealm') {
			return existing
		}

		const entityRealm = this.createEntityRealm(blueprint, realmKey, entity)

		this.registerEntityRealm(entityRealm)

		// if (blueprint.creationParameters.forceCreation && !entity.id.existsOnServer) {
		// 	entityRealm.unpersistedChangesCount += 1
		// }

		const persistedData = this.treeStore.persistedEntityData.get(entity.id.uniqueValue)

		const marker = getEntityMarker(state)
		const pathBack = this.treeStore.getPathBackToParent(entityRealm)

		for (const [placeholderName, field] of marker.fields.markers) {
			const fieldDatum = persistedData?.get(placeholderName)

			if (field instanceof FieldMarker) {
				this.initializeFromFieldMarker(entityRealm, field, fieldDatum)
			} else if (field instanceof HasManyRelationMarker) {
				// if (pathBack?.fieldBackToParent === field.parameters.field) {
				// 	// TODO this is probably wrong?
				// 	const ids = pathBack.parent.children.get(field.placeholderName)
				// 	const newData = this.treeStore.persistedEntityData.get(pathBack.parent.entity.id.value)
				// 	console.log('many?', pathBack, field, entityRealm, fieldDatum, ids)
				// }
				this.initializeFromHasManyRelationMarker(entityRealm, field, fieldDatum instanceof Set ? fieldDatum : new Set())
			} else if (field instanceof HasOneRelationMarker) {
				let runtimeId: RuntimeId
				if (pathBack?.fieldBackToParent === field.parameters.field) {
					runtimeId = pathBack.parent.entity.id
				} else {
					runtimeId = fieldDatum instanceof ServerId ? fieldDatum : new UnpersistedEntityDummyId()
				}
				this.initializeFromHasOneRelationMarker(entityRealm, field, runtimeId)
			} else {
				assertNever(field)
			}
		}

		this.eventManager.registerNewlyInitialized(entityRealm)

		return entityRealm
	}

	private registerEntityRealm(entityRealm: EntityRealmState | EntityRealmStateStub) {
		const { realmKey, blueprint, entity } = entityRealm

		this.treeStore.entityRealmStore.set(entityRealm.realmKey, entityRealm)

		if (blueprint.type === 'listEntity') {
			blueprint.parent.children.set(entity.id.value, entityRealm)
		} else if (blueprint.type === 'hasOne') {
			blueprint.parent.children.set(blueprint.marker.placeholderName, entityRealm)
		}
		entity.realms.set(realmKey, entityRealm)
	}

	public initializeEntityState(id: RuntimeId, entityName: EntityName): EntityState {
		const entityId = id.uniqueValue

		const existing = this.treeStore.entityStore.get(entityId)
		if (existing !== undefined) {
			return existing
		}

		const entityState: EntityState = {
			entityName,
			hasIdSetInStone: id instanceof ServerId,
			id,
			isScheduledForDeletion: false,
			maidenId: id instanceof UnpersistedEntityDummyId ? id : undefined,
			realms: new Map(),
		}
		this.treeStore.entityStore.set(entityId, entityState)

		return entityState
	}

	private initializeEntityListState(
		blueprint: EntityListBlueprint,
		entityName: EntityName,
		initialEntityIds: Set<EntityId>,
	): EntityListState {
		const entityListState: EntityListState = {
			type: 'entityList',
			accessor: undefined,
			blueprint,
			children: new BijectiveIndexedMap(realm => realm.entity.id.value),
			childrenWithPendingUpdates: undefined,
			entityName,
			eventListeners: this.initializeEntityListEventListenerStore(blueprint),
			childEventListeners: this.initializeEntityListChildEventListenerStore(blueprint),
			errors: undefined,
			plannedRemovals: undefined,
			unpersistedChangesCount: 0, // TODO force creation?
			getAccessor: () => {
				if (entityListState.accessor === undefined) {
					const persistedEntityIds = this.treeStore.getEntityListPersistedIds(entityListState)
					entityListState.accessor = new EntityListAccessor(
						entityListState,
						this.listOperations,
						entityListState.children,
						persistedEntityIds,
						entityListState.unpersistedChangesCount !== 0,
						entityListState.errors,
						entityListState.blueprint.marker.environment,
						entityListState.getAccessor,
					)
				}
				return entityListState.accessor
			},
		}

		const initialData: Iterable<EntityId | undefined> =
			initialEntityIds.size === 0
				? Array.from({ length: blueprint.marker.parameters.initialEntityCount })
				: initialEntityIds
		for (const entityId of initialData) {
			this.initializeEntityRealm(
				entityId ? new ServerId(entityId, entityName) : new UnpersistedEntityDummyId(),
				entityListState.entityName,
				{
					type: 'listEntity',
					parent: entityListState,
				},
			)
		}

		this.eventManager.registerNewlyInitialized(entityListState)

		return entityListState
	}

	private initializeFieldState(
		parent: EntityRealmState,
		placeholderName: FieldName,
		fieldMarker: FieldMarker,
		persistedValue: FieldValue | undefined,
		copyFromState: FieldState | undefined,
	): FieldState {
		const resolvedFieldValue = copyFromState ? copyFromState.value : (persistedValue ?? fieldMarker.defaultValue ?? null)

		const fieldState: FieldState = {
			type: 'field',
			accessor: undefined,
			fieldMarker,
			placeholderName,
			persistedValue,
			parent,
			value: resolvedFieldValue,
			eventListeners: this.initializeFieldEventListenerStore(fieldMarker),
			errors: undefined,
			touchLog: undefined,
			hasUnpersistedChanges: copyFromState?.hasUnpersistedChanges ?? false,

			getAccessor: () => {
				if (fieldState.accessor === undefined) {
					const fieldSchema = this.treeStore.schema.getEntityColumn(parent.entity.entityName, fieldMarker.fieldName)

					fieldState.accessor = new FieldAccessor(
						fieldState,
						this.fieldOperations,
						fieldState.placeholderName,
						fieldState.value,
						fieldState.persistedValue === undefined ? null : fieldState.persistedValue,
						fieldState.fieldMarker.defaultValue,
						fieldState.errors,
						fieldState.hasUnpersistedChanges,
						fieldState.touchLog,
						fieldState.getAccessor,
						fieldSchema,
					)
				}
				return fieldState.accessor
			},
		}

		this.eventManager.registerNewlyInitialized(fieldState)
		return fieldState
	}

	private initializeFromFieldMarker(
		parent: EntityRealmState,
		field: FieldMarker,
		persistedValue: EntityFieldPersistedData | undefined,
		copyFromState?: FieldState,
	) {
		if (persistedValue instanceof Set) {
			throw new BindingError(
				`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
					`Perhaps you wanted to use a <Repeater />?`,
			)
		}
		if (persistedValue instanceof ServerId) {
			throw new BindingError(
				`Received a referenced entity where a single '${field.fieldName}' field was expected. ` +
					`Perhaps you wanted to use <HasOne />?`,
			)
		}
		parent.children.set(
			field.placeholderName,
			this.initializeFieldState(parent, field.placeholderName, field, persistedValue, copyFromState),
		)
	}

	private initializeFromHasOneRelationMarker(
		parent: EntityRealmState,
		field: HasOneRelationMarker,
		entityId: RuntimeId,
		copyFrom?: EntityRealmState | EntityRealmStateStub,
	) {
		parent.children.set(
			field.placeholderName,
			this.initializeEntityRealm(entityId, this.getRelationTargetEntityName(parent, field), {
				type: 'hasOne',
				parent,
				marker: field,
			}, copyFrom),
		)
		// if (fieldDatum instanceof ServerGeneratedUuid || fieldDatum === null || fieldDatum === undefined) {
		// 	const entityId = fieldDatum instanceof ServerGeneratedUuid ? fieldDatum : new UnpersistedEntityDummyId()
		//
		//
		// } else if (fieldDatum instanceof Set) {
		// 	throw new BindingError(
		// 		`Received a collection of entities for field '${relation.field}' where a single entity was expected. ` +
		// 			`Perhaps you wanted to use a <Repeater />?`,
		// 	)
		// } else {
		// 	throw new BindingError(
		// 		`Received a scalar value for field '${relation.field}' where a single entity was expected.` +
		// 			`Perhaps you meant to use a variant of <Field />?`,
		// 	)
		// }
	}

	private initializeFromHasManyRelationMarker(
		parent: EntityRealmState,
		field: HasManyRelationMarker,
		persistedEntityIds: Set<EntityId>,
	) {
		parent.children.set(
			field.placeholderName,
			this.initializeEntityListState(
				{ marker: field, parent },
				this.getRelationTargetEntityName(parent, field),
				persistedEntityIds,
			),
		)
		// const relation = field.parameters
		//
		// if (fieldDatum === undefined || fieldDatum instanceof Set) {
		//
		// } else if (typeof fieldDatum === 'object') {
		// 	// Intentionally allowing `fieldDatum === null` here as well since this should only happen when a *hasOne
		// 	// relation is unlinked, e.g. a Person does not have a linked Nationality.
		// 	throw new BindingError(
		// 		`Received a referenced entity for field '${relation.field}' where a collection of entities was expected.` +
		// 			`Perhaps you wanted to use a <HasOne />?`,
		// 	)
		// } else {
		// 	throw new BindingError(
		// 		`Received a scalar value for field '${relation.field}' where a collection of entities was expected.` +
		// 			`Perhaps you meant to use a variant of <Field />?`,
		// 	)
		// }
	}

	private getRelationTargetEntityName(
		entityRealm: EntityRealmState,
		field: HasOneRelationMarker | HasManyRelationMarker,
	): EntityName {
		const targetField = this.treeStore.schema.getEntityRelation(entityRealm.entity.entityName, field.parameters.field)
		return targetField.targetEntity
	}

	public runImmediateUserInitialization(
		realm: EntityRealmState | EntityRealmStateStub,
		initialize: EntityAccessor.BatchUpdatesHandler | undefined,
	) {
		if (initialize === undefined) {
			return
		}
		const entityRealm = this.materializeEntityRealm(realm)

		realm.getAccessor().batchUpdates(initialize)

		const initializeListeners = this.eventManager.getEventListeners(entityRealm, { type: 'initialize' })
		if (initializeListeners === undefined || initializeListeners.size === 0) {
			realm.entity.hasIdSetInStone = true
		}
	}

	public initializeEntityEventListenerStore(blueprint: EntityRealmBlueprint): EntityEventListenerStore | undefined {
		if (blueprint.type === 'listEntity') {
			const blueprintListeners = blueprint.parent.blueprint.marker.parameters.childEventListeners
			const childInitialize = blueprintListeners?.get({ type: 'initialize' })
			const store: EntityEventListenerStore = new EventListenersStore(() => blueprint.parent.childEventListeners)

			if (childInitialize !== undefined) {
				store.set({ type: 'initialize' }, childInitialize)
			}
			return store
		}

		const blueprintListeners = blueprint.marker.parameters.eventListeners
		if (blueprintListeners === undefined) {
			return undefined
		}
		return TreeParameterMerger.cloneSingleEntityEventListeners(blueprintListeners)
	}

	private initializeEntityListEventListenerStore(
		blueprint: EntityListBlueprint,
	): EntityListEventListenerStore | undefined {
		const blueprintListeners = blueprint.marker.parameters.eventListeners

		if (blueprintListeners === undefined) {
			return undefined
		}
		return TreeParameterMerger.cloneEntityListEventListeners(blueprintListeners)
	}

	private initializeEntityListChildEventListenerStore(
		blueprint: EntityListBlueprint,
	): EntityEventListenerStore | undefined {
		const blueprintListeners = blueprint.marker.parameters.childEventListeners

		if (blueprintListeners === undefined) {
			return undefined
		}
		return TreeParameterMerger.cloneSingleEntityEventListeners(blueprintListeners)
	}

	private initializeFieldEventListenerStore(marker: FieldMarker): FieldEventListenerStore | undefined {
		// TODO !!!
		return undefined
	}
}
