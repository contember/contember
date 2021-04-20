import { BatchUpdatesOptions, EntityAccessor, EntityListAccessor, ErrorAccessor, FieldAccessor } from '../accessors'
import { EntityFieldPersistedData, RuntimeId, ServerGeneratedUuid, UnpersistedEntityDummyId } from '../accessorTree'
import { BindingError } from '../BindingError'
import {
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
} from '../markers'
import {
	EntityEventListenerStore,
	EntityListEventListenerStore,
	EntityName,
	FieldEventListenerStore,
	FieldName,
	Scalar,
} from '../treeParameters'
import { assertNever } from '../utils'
import { AccessorErrorManager } from './AccessorErrorManager'
import { Config } from './Config'
import { EventManager } from './EventManager'
import { EntityOperations, FieldOperations, ListOperations } from './operations'
import { OperationsHelpers } from './operations/OperationsHelpers'
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
	StateType,
} from './state'
import { BijectiveIndexedMap } from './structures'
import { TreeParameterMerger } from './TreeParameterMerger'
import { TreeStore } from './TreeStore'

export class StateInitializer {
	private readonly fieldOperations: FieldOperations
	private readonly entityOperations: EntityOperations
	private readonly listOperations: ListOperations

	public constructor(
		private readonly accessorErrorManager: AccessorErrorManager,
		private readonly batchUpdatesOptions: BatchUpdatesOptions,
		private readonly config: Config,
		private readonly eventManager: EventManager,
		private readonly treeStore: TreeStore,
	) {
		this.fieldOperations = new FieldOperations(this.accessorErrorManager, this.eventManager, this, this.treeStore)
		this.entityOperations = new EntityOperations(
			this.accessorErrorManager,
			this.batchUpdatesOptions,
			this.eventManager,
			this,
			this.treeStore,
		)
		this.listOperations = new ListOperations(
			this.accessorErrorManager,
			this.batchUpdatesOptions,
			this.eventManager,
			this,
			this.treeStore,
		)
	}

	public initializeSubTree(tree: EntitySubTreeMarker | EntityListSubTreeMarker): RootStateNode {
		let subTreeState: RootStateNode
		const persistedRootData = this.treeStore.subTreePersistedData.get(tree.placeholderName)

		if (tree instanceof EntityListSubTreeMarker) {
			const persistedEntityIds: Set<string> = persistedRootData instanceof Set ? persistedRootData : new Set()
			subTreeState = this.initializeEntityListState(
				{ marker: tree, parent: undefined },
				tree.entityName,
				persistedEntityIds,
			)
		} else {
			subTreeState = this.materializeEntityRealm(
				this.initializeEntityRealm(
					persistedRootData instanceof ServerGeneratedUuid ? persistedRootData : new UnpersistedEntityDummyId(),
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

		const stub: EntityRealmStateStub = {
			type: StateType.EntityRealmStub,

			blueprint,
			entity,
			realmKey,
			getAccessor: () => this.materializeEntityRealm(stub).getAccessor(),
		}
		this.registerEntityRealm(stub)

		return stub
	}

	private materializeEntityRealm(state: EntityRealmState | EntityRealmStateStub): EntityRealmState {
		if (state.type === StateType.EntityRealm) {
			return state
		}
		const { realmKey, entity, blueprint } = state

		const existing = this.treeStore.entityRealmStore.get(realmKey)
		if (existing !== undefined && existing.type === StateType.EntityRealm) {
			return existing
		}

		const entityRealm: EntityRealmState = {
			type: StateType.EntityRealm,

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
			unpersistedChangesCount: 0,
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
						this.treeStore.persistedEntityData.get(entity.id.value),
						entityRealm.errors,
						getEntityMarker(entityRealm).environment,
						entityRealm.getAccessor,
					)
				}
				return entityRealm.accessor
			},
		}

		this.registerEntityRealm(entityRealm)

		// if (blueprint.creationParameters.forceCreation && !entity.id.existsOnServer) {
		// 	entityRealm.unpersistedChangesCount += 1
		// }

		const persistedData = this.treeStore.persistedEntityData.get(entity.id.value)

		const marker = getEntityMarker(state)
		const pathBack = this.getPathBackToParent(entityRealm)

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
					runtimeId = fieldDatum instanceof ServerGeneratedUuid ? fieldDatum : new UnpersistedEntityDummyId()
				}
				this.initializeFromHasOneRelationMarker(entityRealm, field, runtimeId)
			} else {
				assertNever(field)
			}
		}

		this.eventManager.registerNewlyInitialized(entityRealm)

		return entityRealm
	}

	private getPathBackToParent(
		entityRealm: EntityRealmState,
	):
		| {
				fieldBackToParent: FieldName
				parent: EntityRealmState
		  }
		| undefined {
		const blueprint = entityRealm.blueprint
		if (blueprint.parent === undefined) {
			return undefined
		}
		let parentEntityName: EntityName
		let relationFromParent: FieldName
		let parent: EntityRealmState

		if (blueprint.type === 'hasOne') {
			parentEntityName = blueprint.parent.entity.entityName
			relationFromParent = blueprint.marker.parameters.field
			parent = blueprint.parent
		} else if (blueprint.type === 'listEntity') {
			const grandparentBlueprint = blueprint.parent.blueprint

			if (grandparentBlueprint.parent === undefined) {
				return undefined
			}
			parentEntityName = grandparentBlueprint.parent.entity.entityName
			relationFromParent = grandparentBlueprint.marker.parameters.field
			parent = grandparentBlueprint.parent
		} else {
			return assertNever(blueprint)
		}

		const relationSchema = this.treeStore.schema.getEntityField(parentEntityName, relationFromParent)

		if (relationSchema?.__typename !== '_Relation') {
			throw new BindingError()
		}
		const fieldBack = (relationSchema.ownedBy || relationSchema.inversedBy) ?? null

		// console.log(parentEntityName, relationFromParent, entityRealm.entity.entityName, fieldBack)
		if (fieldBack === null) {
			return undefined
		}
		return {
			parent,
			fieldBackToParent: fieldBack,
		}
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
		const entityId = id.value

		const existing = this.treeStore.entityStore.get(entityId)
		if (existing !== undefined) {
			return existing
		}

		const entityState: EntityState = {
			entityName,
			hasIdSetInStone: id instanceof ServerGeneratedUuid,
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
		initialEntityIds: Set<string>,
	): EntityListState {
		const entityListState: EntityListState = {
			type: StateType.EntityList,
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
					const persistedEntityIds = OperationsHelpers.getEntityListPersistedIds(this.treeStore, entityListState)
					entityListState.accessor = new EntityListAccessor(
						entityListState,
						this.listOperations,
						entityListState.children,
						persistedEntityIds,
						entityListState.errors,
						entityListState.blueprint.marker.environment,
						entityListState.getAccessor,
					)
				}
				return entityListState.accessor
			},
		}

		const initialData: Set<string | undefined> =
			initialEntityIds.size === 0
				? new Set(Array.from({ length: blueprint.marker.parameters.initialEntityCount }))
				: initialEntityIds
		for (const entityId of initialData) {
			this.initializeEntityRealm(
				entityId ? new ServerGeneratedUuid(entityId) : new UnpersistedEntityDummyId(),
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
		persistedValue: Scalar | undefined,
	): FieldState {
		const resolvedFieldValue = persistedValue ?? fieldMarker.defaultValue ?? null

		const fieldState: FieldState = {
			type: StateType.Field,
			accessor: undefined,
			fieldMarker,
			placeholderName,
			persistedValue,
			parent,
			value: resolvedFieldValue,
			eventListeners: this.initializeFieldEventListenerStore(fieldMarker),
			errors: undefined,
			touchLog: undefined,
			hasUnpersistedChanges: false,
			getAccessor: () => {
				if (fieldState.accessor === undefined) {
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
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		if (fieldDatum instanceof Set) {
			throw new BindingError(
				`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
					`Perhaps you wanted to use a <Repeater />?`,
			)
		}
		if (fieldDatum instanceof ServerGeneratedUuid) {
			throw new BindingError(
				`Received a referenced entity where a single '${field.fieldName}' field was expected. ` +
					`Perhaps you wanted to use <HasOne />?`,
			)
		}
		parent.children.set(
			field.placeholderName,
			this.initializeFieldState(parent, field.placeholderName, field, fieldDatum),
		)
	}

	private initializeFromHasOneRelationMarker(
		parent: EntityRealmState,
		field: HasOneRelationMarker,
		entityId: RuntimeId,
	) {
		parent.children.set(
			field.placeholderName,
			this.initializeEntityRealm(entityId, this.getRelationTargetEntityName(parent, field), {
				type: 'hasOne',
				parent,
				marker: field,
			}),
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
		persistedEntityIds: Set<string>,
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
		const targetField = this.treeStore.schema.getEntityField(entityRealm.entity.entityName, field.parameters.field)

		if (targetField?.__typename !== '_Relation') {
			throw new BindingError() // This should have been validated elsewhere.
		}
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

		const initializeListeners = this.eventManager.getEventListeners(entityRealm, 'initialize')
		if (initializeListeners === undefined || initializeListeners.size === 0) {
			realm.entity.hasIdSetInStone = true
		}
	}

	public initializeEntityEventListenerStore(blueprint: EntityRealmBlueprint): EntityEventListenerStore | undefined {
		if (blueprint.type === 'listEntity') {
			const blueprintListeners = blueprint.parent.blueprint.marker.parameters.eventListeners
			const childInitialize = blueprintListeners?.get('childInitialize')

			if (childInitialize === undefined) {
				return undefined
			}
			return new Map([['initialize', new Set(childInitialize)]]) as EntityEventListenerStore
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
