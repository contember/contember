import { GraphQlBuilder } from '@contember/client'
import { BindingOperations, EntityAccessor, EntityListAccessor, ErrorAccessor, FieldAccessor } from '../accessors'
import { EntityFieldPersistedData, RuntimeId, ServerGeneratedUuid, UnpersistedEntityDummyId } from '../accessorTree'
import { BindingError } from '../BindingError'
import {
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
} from '../markers'
import { EntityName, FieldName, Scalar, SingleEntityEventListeners } from '../treeParameters'
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
		private readonly bindingOperations: BindingOperations,
		private readonly config: Config,
		private readonly eventManager: EventManager,
		private readonly treeStore: TreeStore,
	) {
		this.fieldOperations = new FieldOperations(this.eventManager, this.treeStore)
		this.entityOperations = new EntityOperations(this.bindingOperations, this.eventManager, this, this.treeStore)
		this.listOperations = new ListOperations(this.bindingOperations, this.eventManager, this, this.treeStore)
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

			children: new Map(),
			childrenWithPendingUpdates: undefined,
			errors: undefined,
			eventListeners: this.initializeEntityEventListeners(blueprint),
			fieldsWithPendingConnectionUpdates: undefined,
			hasStaleAccessor: true,
			plannedHasOneDeletions: undefined,
			unpersistedChangesCount: 0,

			addError: error => {
				return this.accessorErrorManager.addError(entityRealm, { type: ErrorAccessor.ErrorType.Validation, error })
			},
			addEventListener: (type: EntityAccessor.EntityEventType, ...args: unknown[]) => {
				return this.entityOperations.addEventListener(entityRealm, type, ...args)
			},
			batchUpdates: performUpdates => {
				this.entityOperations.batchUpdates(entityRealm, performUpdates)
			},
			connectEntityAtField: (fieldName, entityToConnect) => {
				this.entityOperations.connectEntityAtField(entityRealm, fieldName, entityToConnect)
			},
			disconnectEntityAtField: (fieldName, initializeReplacement) => {
				this.entityOperations.disconnectEntityAtField(entityRealm, fieldName, initializeReplacement)
			},
			getAccessor: (() => {
				let accessor: EntityAccessor | undefined = undefined
				return () => {
					if (entityRealm.hasStaleAccessor || accessor === undefined) {
						entityRealm.hasStaleAccessor = false
						const entity = entityRealm.entity
						accessor = new EntityAccessor(
							entity.id,
							entityRealm.realmKey,
							entity.entityName,

							// We're technically exposing more info in runtime than we'd like but that way we don't have to allocate and
							// keep in sync two copies of the same data. TS hides the extra info anyway.
							entityRealm.children,
							this.treeStore.persistedEntityData.get(entity.id.value),
							entityRealm.errors,
							getEntityMarker(entityRealm).environment,
							entityRealm.addError,
							entityRealm.addEventListener,
							entityRealm.batchUpdates,
							entityRealm.connectEntityAtField,
							entityRealm.disconnectEntityAtField,
							entity.deleteEntity,
						)
					}
					return accessor
				}
			})(),
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
			} else if (field instanceof EntityListSubTreeMarker || field instanceof EntitySubTreeMarker) {
				// Do nothing: all sub trees have been hoisted and aren't handled from here.
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

	private initializeEntityState(id: RuntimeId, entityName: EntityName): EntityState {
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

			deleteEntity: () => {
				this.entityOperations.deleteEntity(entityState)
			},
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
			blueprint,
			addEventListener: undefined as any,
			children: new BijectiveIndexedMap(realm => realm.entity.id.value),
			childrenWithPendingUpdates: undefined,
			entityName,
			eventListeners: TreeParameterMerger.cloneEntityListEventListeners(blueprint.marker.parameters.eventListeners),
			errors: undefined,
			plannedRemovals: undefined,
			hasStaleAccessor: true,
			unpersistedChangesCount: 0, // TODO force creation?
			getAccessor: (() => {
				let accessor: EntityListAccessor | undefined = undefined
				return () => {
					if (entityListState.hasStaleAccessor || accessor === undefined) {
						const persistedEntityIds = OperationsHelpers.getEntityListPersistedIds(this.treeStore, entityListState)
						entityListState.hasStaleAccessor = false
						accessor = new EntityListAccessor(
							entityListState.children,
							persistedEntityIds,
							this.bindingOperations,
							entityListState.errors,
							entityListState.blueprint.marker.environment,
							entityListState.addError,
							entityListState.addEventListener,
							entityListState.batchUpdates,
							entityListState.connectEntity,
							entityListState.createNewEntity,
							entityListState.disconnectEntity,
							entityListState.getChildEntityById,
						)
					}
					return accessor
				}
			})(),
			addError: error =>
				this.accessorErrorManager.addError(entityListState, { type: ErrorAccessor.ErrorType.Validation, error }),
			batchUpdates: performUpdates => {
				this.listOperations.batchUpdates(entityListState, performUpdates)
			},
			connectEntity: entityToConnect => {
				this.listOperations.connectEntity(entityListState, entityToConnect)
			},
			createNewEntity: initialize => {
				this.listOperations.createNewEntity(entityListState, initialize)
			},
			disconnectEntity: childEntity => {
				this.listOperations.disconnectEntity(entityListState, childEntity)
			},
			getChildEntityById: id => {
				return this.listOperations.getChildEntityById(entityListState, id)
			},
		}
		entityListState.addEventListener = this.getAddEventListener(entityListState)

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

	public runImmediateUserInitialization(
		realm: EntityRealmState | EntityRealmStateStub,
		initialize: EntityAccessor.BatchUpdatesHandler | undefined,
	) {
		if (initialize === undefined) {
			return
		}
		const entityRealm = this.materializeEntityRealm(realm)

		realm.getAccessor().batchUpdates(initialize)

		if (entityRealm.eventListeners.initialize === undefined || entityRealm.eventListeners.initialize.size === 0) {
			realm.entity.hasIdSetInStone = true
		}
	}

	private initializeEntityEventListeners(
		blueprint: EntityRealmBlueprint,
	): SingleEntityEventListeners['eventListeners'] {
		if (blueprint.type === 'listEntity') {
			return this.eventManager.getEventListenersForListEntity(blueprint.parent)
		}
		return TreeParameterMerger.cloneSingleEntityEventListeners(blueprint.marker.parameters.eventListeners)
	}
}
