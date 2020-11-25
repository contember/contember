import { GraphQlBuilder } from '@contember/client'
import { noop } from '@contember/react-utils'
import { validate as uuidValidate } from 'uuid'
import { BindingOperations, EntityAccessor, EntityListAccessor, ErrorAccessor, FieldAccessor } from '../accessors'
import {
	ClientGeneratedUuid,
	EntityFieldPersistedData,
	ServerGeneratedUuid,
	UnpersistedEntityKey,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import {
	EntityFieldMarkersContainer,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	SubTreeMarker,
} from '../markers'
import {
	EntityCreationParameters,
	EntityListEventListeners,
	EntityListPreferences,
	FieldName,
	Scalar,
	SingleEntityEventListeners,
} from '../treeParameters'
import { assertNever } from '../utils'
import { AccessorErrorManager } from './AccessorErrorManager'
import { Config } from './Config'
import { DirtinessTracker } from './DirtinessTracker'
import { EventManager } from './EventManager'
import { MarkerMerger } from './MarkerMerger'
import {
	EntityListState,
	EntityState,
	FieldState,
	OnEntityListUpdate,
	OnEntityUpdate,
	OnFieldUpdate,
	RootStateNode,
	StateINode,
	StateNode,
	StateType,
} from './state'
import { TreeStore } from './TreeStore'
import { TreeParameterMerger } from './TreeParameterMerger'

export class StateInitializer {
	public constructor(
		private readonly accessorErrorManager: AccessorErrorManager,
		private readonly bindingOperations: BindingOperations,
		private readonly config: Config,
		private readonly dirtinessTracker: DirtinessTracker,
		private readonly eventManager: EventManager,
		private readonly treeStore: TreeStore,
	) {}

	public initializeSubTree(
		tree: SubTreeMarker,
		persistedRootData: ServerGeneratedUuid | Set<string> | undefined,
	): RootStateNode {
		let subTreeState: RootStateNode

		if (tree.parameters.type === 'qualifiedEntityList' || tree.parameters.type === 'unconstrainedQualifiedEntityList') {
			const persistedEntityIds: Set<string> = persistedRootData instanceof Set ? persistedRootData : new Set()
			subTreeState = this.initializeEntityListAccessor(
				tree.environment,
				tree.fields,
				tree.parameters.value,
				noop,
				persistedEntityIds,
				tree.parameters.value,
			)
		} else {
			const id = persistedRootData instanceof ServerGeneratedUuid ? persistedRootData : new UnpersistedEntityKey()
			subTreeState = this.initializeEntityAccessor(
				id,
				tree.environment,
				tree.fields,
				tree.parameters.value,
				noop,
				tree.parameters.value,
			)
		}
		this.treeStore.subTreeStates.set(tree.placeholderName, subTreeState)

		return subTreeState
	}

	public initializeEntityAccessor(
		id: EntityAccessor.RuntimeId,
		environment: Environment,
		markersContainer: EntityFieldMarkersContainer,
		creationParameters: EntityCreationParameters,
		onEntityUpdate: OnEntityUpdate,
		initialEventListeners: SingleEntityEventListeners | undefined,
	): EntityState {
		const entityKey = id.value
		const existingEntityState = this.treeStore.entityStore.get(entityKey)

		if (existingEntityState !== undefined) {
			existingEntityState.markersContainer = MarkerMerger.mergeEntityFieldsContainers(
				existingEntityState.markersContainer,
				markersContainer,
			)
			existingEntityState.realms.add(onEntityUpdate)
			existingEntityState.hasStaleAccessor = true
			existingEntityState.eventListeners = TreeParameterMerger.mergeSingleEntityEventListeners(
				TreeParameterMerger.cloneSingleEntityEventListeners(existingEntityState.eventListeners),
				TreeParameterMerger.cloneSingleEntityEventListeners(initialEventListeners?.eventListeners),
			)
			existingEntityState.creationParameters = {
				forceCreation: existingEntityState.creationParameters.forceCreation || creationParameters.forceCreation,
				isNonbearing: existingEntityState.creationParameters.isNonbearing && creationParameters.isNonbearing, // If either is false, it's bearing
				setOnCreate: TreeParameterMerger.mergeSetOnCreate(
					existingEntityState.creationParameters.setOnCreate,
					creationParameters.setOnCreate,
				),
			}
			this.mergeInEntityFieldsContainer(existingEntityState, markersContainer)

			this.eventManager.registerNewlyInitialized(existingEntityState)

			return existingEntityState
		}

		const entityState: EntityState = {
			type: StateType.SingleEntity,
			batchUpdateDepth: 0,
			fieldsWithPendingConnectionUpdates: undefined,
			childrenWithPendingUpdates: undefined,
			creationParameters,
			environment,
			errors: undefined,
			eventListeners: TreeParameterMerger.cloneSingleEntityEventListeners(initialEventListeners?.eventListeners),
			fields: new Map(),
			hasIdSetInStone: true,
			hasPendingUpdate: false,
			hasPendingParentNotification: false,
			hasStaleAccessor: true,
			id,
			isScheduledForDeletion: false,
			maidenKey: id instanceof UnpersistedEntityKey ? id.value : undefined,
			markersContainer,
			persistedData: this.treeStore.persistedEntityData.get(entityKey),
			plannedHasOneDeletions: undefined,
			realms: new Set([onEntityUpdate]),
			typeName: undefined,
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
							entityState.fields,
							entityState.persistedData,
							entityState.errors,
							entityState.environment,
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
			onChildFieldUpdate: (updatedState: StateNode) => {
				// No before update for child updates!
				batchUpdatesImplementation(() => {
					if (updatedState.type === StateType.Field && updatedState.placeholderName === PRIMARY_KEY_NAME) {
						if (entityState.id.existsOnServer) {
							throw new BindingError(
								`Trying to change the id of an entity that already exists on the server. ` +
									`That is strictly prohibited. Once created, an entity's id cannot be changed.`,
							)
						}
						if (entityState.hasIdSetInStone) {
							throw new BindingError(
								`Trying to change the id of an entity at a time it's no longer allowed. ` +
									`In order to change it, it needs to be set immediately after initialization of the entity.`,
							)
						}
						entityState.hasIdSetInStone = true
						const previousKey = entityState.id.value
						const newKey = updatedState.value as string
						entityState.id = new ClientGeneratedUuid(newKey)
						this.treeStore.entityStore.delete(previousKey)
						this.treeStore.entityStore.set(newKey, entityState)
					}
					if (updatedState.type === StateType.SingleEntity && updatedState.maidenKey !== updatedState.id.value) {
						const relevantPlaceholders = this.findChildPlaceholdersByState(entityState, updatedState)
						this.eventManager.markPendingConnections(entityState, relevantPlaceholders)
					}

					if (updatedState.type === StateType.SingleEntity && updatedState.isScheduledForDeletion) {
						processEntityDeletion(updatedState)
					} else {
						this.markChildStateInNeedOfUpdate(entityState, updatedState)
					}
					entityState.hasStaleAccessor = true
					entityState.hasPendingParentNotification = true
				})
			},
			addError: error =>
				this.accessorErrorManager.addError(entityState, { type: ErrorAccessor.ErrorType.Validation, error }),
			addEventListener: (type: EntityAccessor.EntityEventType, ...args: unknown[]) => {
				if (type === 'connectionUpdate') {
					if (entityState.eventListeners.connectionUpdate === undefined) {
						entityState.eventListeners.connectionUpdate = new Map()
					}
					const fieldName = args[0] as FieldName
					const listener = args[1] as EntityAccessor.UpdateListener
					const existingListeners = entityState.eventListeners.connectionUpdate.get(fieldName)

					if (existingListeners === undefined) {
						entityState.eventListeners.connectionUpdate.set(fieldName, new Set([listener]))
					} else {
						existingListeners.add(listener)
					}
					return () => {
						const existingListeners = entityState.eventListeners.connectionUpdate?.get(fieldName)
						if (existingListeners === undefined) {
							return // Throw an error? This REALLY should not happen.
						}
						existingListeners.delete(listener)
					}
				} else {
					const listener = args[0] as EntityAccessor.EntityEventListenerMap[typeof type]
					if (entityState.eventListeners[type] === undefined) {
						entityState.eventListeners[type] = new Set<never>()
					}
					entityState.eventListeners[type]!.add(listener as any)
					return () => {
						if (entityState.eventListeners[type] === undefined) {
							return // Throw an error? This REALLY should not happen.
						}
						entityState.eventListeners[type]!.delete(listener as any)
						if (entityState.eventListeners[type]!.size === 0) {
							entityState.eventListeners[type] = undefined
						}
					}
				}
			},
			batchUpdates: performUpdates => {
				this.eventManager.syncOperation(() => {
					performOperationWithBeforeUpdate(() => {
						batchUpdatesImplementation(performUpdates)
					})
				})
			},
			connectEntityAtField: (fieldName, entityToConnectOrItsKey) => {
				this.eventManager.syncOperation(() => {
					performOperationWithBeforeUpdate(() => {
						const hasOneMarkers = resolveHasOneRelationMarkers(
							fieldName,
							`Cannot connect at field '${fieldName}' as it doesn't refer to a has one relation.`,
						)
						for (const hasOneMarker of hasOneMarkers) {
							const previouslyConnectedState = entityState.fields.get(hasOneMarker.placeholderName)

							if (previouslyConnectedState === undefined || previouslyConnectedState.type !== StateType.SingleEntity) {
								this.rejectInvalidAccessorTree()
							}

							const [connectedEntityKey, newlyConnectedState] = this.resolveAndPrepareEntityToConnect(
								entityToConnectOrItsKey,
							)

							if (previouslyConnectedState === newlyConnectedState) {
								return // Do nothing.
							}
							// TODO remove from planned deletions if appropriate

							const persistedKey = entityState.persistedData?.get(hasOneMarker.placeholderName)
							if (persistedKey instanceof ServerGeneratedUuid) {
								if (persistedKey.value === connectedEntityKey) {
									this.dirtinessTracker.decrement() // It was removed from the list but now we're adding it back.
								} else if (persistedKey.value === previouslyConnectedState.id.value) {
									this.dirtinessTracker.increment() // We're changing it from the persisted id.
								}
							} else if (!previouslyConnectedState.id.existsOnServer) {
								// This assumes the invariant enforced above that we cannot connect unpersisted entities.
								// Hence the previouslyConnectedState still refers to the entity created initially.

								if (
									persistedKey === null || // We're updating.
									(persistedKey === undefined && // We're creating.
										(!entityState.markersContainer.hasAtLeastOneBearingField || !hasOneMarker.relation.isNonbearing))
								) {
									this.dirtinessTracker.increment()
								}
							}

							// TODO do something about the existing state…

							newlyConnectedState.realms.add(entityState.onChildFieldUpdate)
							entityState.fields.set(hasOneMarker.placeholderName, newlyConnectedState)
							entityState.hasStaleAccessor = true
							entityState.hasPendingParentNotification = true
						}
						if (entityState.fieldsWithPendingConnectionUpdates === undefined) {
							entityState.fieldsWithPendingConnectionUpdates = new Set()
						}
						entityState.fieldsWithPendingConnectionUpdates.add(fieldName)
					})
				})
			},
			disconnectEntityAtField: (fieldName, initializeReplacement) => {
				this.eventManager.syncOperation(() => {
					performOperationWithBeforeUpdate(() => {
						const hasOneMarkers = resolveHasOneRelationMarkers(
							fieldName,
							`Cannot disconnect the field '${fieldName}' as it doesn't refer to a has one relation.`,
						)
						for (const hasOneMarker of hasOneMarkers) {
							const stateToDisconnect = entityState.fields.get(hasOneMarker.placeholderName)

							if (stateToDisconnect === undefined) {
								throw new BindingError(`Cannot disconnect field '${hasOneMarker.placeholderName}' as it doesn't exist.`)
							}
							if (stateToDisconnect.type !== StateType.SingleEntity) {
								this.rejectInvalidAccessorTree()
							}

							const persistedKey = entityState.persistedData?.get(hasOneMarker.placeholderName)

							if (persistedKey instanceof ServerGeneratedUuid && persistedKey.value === stateToDisconnect.id.value) {
								this.dirtinessTracker.increment()
							} else {
								// Do nothing. Disconnecting unpersisted entities doesn't change the count.
							}

							stateToDisconnect.realms.delete(entityState.onChildFieldUpdate)

							// TODO update changes count?

							const newEntityState = this.initializeEntityAccessor(
								new UnpersistedEntityKey(),
								hasOneMarker.environment,
								hasOneMarker.fields,
								hasOneMarker.relation,
								entityState.onChildFieldUpdate,
								hasOneMarker.relation,
							)
							entityState.fields.set(hasOneMarker.placeholderName, newEntityState)

							entityState.hasStaleAccessor = true
							entityState.hasPendingParentNotification = true

							this.runImmediateUserInitialization(newEntityState, initializeReplacement)
						}
						if (entityState.fieldsWithPendingConnectionUpdates === undefined) {
							entityState.fieldsWithPendingConnectionUpdates = new Set()
						}
						entityState.fieldsWithPendingConnectionUpdates.add(fieldName)
					})
				})
			},
			deleteEntity: () => {
				this.eventManager.syncOperation(() => {
					// Deliberately not calling performOperationWithBeforeUpdate ‒ no beforeUpdate events after deletion
					batchUpdatesImplementation(() => {
						if (entityState.id.existsOnServer) {
							this.dirtinessTracker.increment()
						}
						entityState.isScheduledForDeletion = true
						entityState.hasPendingParentNotification = true
					})
				})
			},
		}
		this.treeStore.entityStore.set(entityKey, entityState)

		const typeName = entityState.persistedData?.get(TYPENAME_KEY_NAME)

		if (typeof typeName === 'string') {
			entityState.typeName = typeName
		}
		if (creationParameters.forceCreation && !id.existsOnServer) {
			this.dirtinessTracker.increment()
		}

		const batchUpdatesImplementation: EntityAccessor.BatchUpdates = performUpdates => {
			if (entityState.isScheduledForDeletion) {
				if (entityState.hasPendingUpdate) {
					// If hasPendingUpdate, we've likely just deleted the entity as a part of this transaction, so don't worry
					// about it and just do nothing.
					return
				}
				throw new BindingError(`Trying to update an entity (or something within said entity) that has been deleted.`)
			}
			entityState.batchUpdateDepth++
			performUpdates(entityState.getAccessor, this.bindingOperations)
			entityState.batchUpdateDepth--

			if (
				entityState.batchUpdateDepth === 0 &&
				// We must have already told the parent if hasPendingUpdate is true. However, we may have updated the entity
				// and then subsequently deleted it, in which case we want to let the parent know regardless.
				(!entityState.hasPendingUpdate || entityState.isScheduledForDeletion) &&
				entityState.hasPendingParentNotification
			) {
				entityState.hasPendingUpdate = true
				entityState.hasPendingParentNotification = false
				for (const onUpdate of entityState.realms) {
					onUpdate(entityState)
				}
			}
		}

		const performOperationWithBeforeUpdate = (operation: () => void) => {
			batchUpdatesImplementation(getAccessor => {
				operation()

				if (
					!entityState.hasPendingParentNotification || // That means the operation hasn't done anything
					entityState.eventListeners.beforeUpdate === undefined ||
					entityState.eventListeners.beforeUpdate.size === 0
				) {
					return
				}

				let currentAccessor: EntityAccessor
				for (let i = 0; i < this.config.getValue('beforeUpdateSettleLimit'); i++) {
					currentAccessor = getAccessor()
					for (const listener of entityState.eventListeners.beforeUpdate) {
						listener(getAccessor, this.bindingOperations)
					}
					if (currentAccessor === getAccessor()) {
						return
					}
				}
				throw new BindingError(
					`EntityAccessor beforeUpdate event: maximum stabilization limit exceeded. ` +
						`This likely means an infinite feedback loop in your code.`,
				)
			})
		}

		const processEntityDeletion = (deletedState: EntityState) => {
			const relevantPlaceholders = this.findChildPlaceholdersByState(entityState, deletedState)

			if (deletedState.id.existsOnServer) {
				if (entityState.plannedHasOneDeletions === undefined) {
					entityState.plannedHasOneDeletions = new Map()
				}
				for (const placeholderName of relevantPlaceholders) {
					entityState.plannedHasOneDeletions.set(placeholderName, deletedState)
				}
			}

			for (const placeholderName of relevantPlaceholders) {
				const newEntityState = this.initializeEntityAccessor(
					new UnpersistedEntityKey(),
					deletedState.environment,
					deletedState.markersContainer,
					deletedState.creationParameters,
					entityState.onChildFieldUpdate,
					initialEventListeners, // TODO this is wrong!!!
				)
				entityState.fields.set(placeholderName, newEntityState)
			}
			// TODO update the changes count
			entityState.childrenWithPendingUpdates?.delete(deletedState)

			this.eventManager.markPendingConnections(entityState, relevantPlaceholders)
		}

		const resolveHasOneRelationMarkers = (field: FieldName, message: string): Set<HasOneRelationMarker> => {
			const placeholders = entityState.markersContainer.placeholders.get(field)

			if (placeholders === undefined) {
				throw new BindingError(message)
			}
			const placeholderArray = placeholders instanceof Set ? Array.from(placeholders) : [placeholders]

			return new Set(
				placeholderArray.map(placeholderName => {
					const hasOneRelation = entityState.markersContainer.markers.get(placeholderName)

					if (!(hasOneRelation instanceof HasOneRelationMarker)) {
						throw new BindingError(message)
					}
					return hasOneRelation
				}),
			)
		}

		this.initializeEntityFields(entityState, markersContainer)

		this.eventManager.registerNewlyInitialized(entityState)

		return entityState
	}

	public initializeEntityListAccessor(
		environment: Environment,
		markersContainer: EntityFieldMarkersContainer,
		creationParameters: EntityCreationParameters & EntityListPreferences,
		onEntityListUpdate: OnEntityListUpdate,
		persistedEntityIds: Set<string>,
		initialEventListeners: EntityListEventListeners | undefined,
	): EntityListState {
		const entityListState: EntityListState = {
			type: StateType.EntityList,
			creationParameters,
			markersContainer,
			onEntityListUpdate,
			persistedEntityIds,
			addEventListener: undefined as any,
			batchUpdateDepth: 0,
			children: new Set(),
			childrenWithPendingUpdates: undefined,
			environment,
			eventListeners: TreeParameterMerger.cloneEntityListEventListeners(initialEventListeners?.eventListeners),
			errors: undefined,
			plannedRemovals: undefined,
			hasPendingParentNotification: false,
			hasPendingUpdate: false,
			hasStaleAccessor: true,
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
			onChildEntityUpdate: updatedState => {
				if (updatedState.type !== StateType.SingleEntity) {
					throw new BindingError(`Illegal entity list value.`)
				}

				// No beforeUpdate for child updates!
				batchUpdatesImplementation(() => {
					if (updatedState.isScheduledForDeletion) {
						processEntityDeletion(updatedState)
					} else {
						this.markChildStateInNeedOfUpdate(entityListState, updatedState)
					}
					entityListState.hasPendingParentNotification = true
					entityListState.hasStaleAccessor = true
				})
			},
			addError: error =>
				this.accessorErrorManager.addError(entityListState, { type: ErrorAccessor.ErrorType.Validation, error }),
			batchUpdates: performUpdates => {
				this.eventManager.syncOperation(() => {
					performOperationWithBeforeUpdate(() => {
						batchUpdatesImplementation(performUpdates)
					})
				})
			},
			connectEntity: entityToConnectOrItsKey => {
				this.eventManager.syncOperation(() => {
					performOperationWithBeforeUpdate(() => {
						const [connectedEntityKey, connectedState] = this.resolveAndPrepareEntityToConnect(entityToConnectOrItsKey)

						if (entityListState.children.has(connectedState)) {
							return
						}

						connectedState.realms.add(entityListState.onChildEntityUpdate)
						entityListState.children.add(connectedState)
						entityListState.plannedRemovals?.delete(connectedState)

						if (entityListState.persistedEntityIds.has(connectedEntityKey)) {
							// It was removed from the list but now we're adding it back.
							this.dirtinessTracker.decrement()
						} else {
							this.dirtinessTracker.increment()
						}

						entityListState.hasPendingParentNotification = true
						entityListState.hasStaleAccessor = true
					})
				})
			},
			createNewEntity: initialize => {
				entityListState.batchUpdates(() => {
					const newState = generateNewEntityState(undefined)
					this.markChildStateInNeedOfUpdate(entityListState, newState)
					entityListState.hasPendingParentNotification = true

					this.runImmediateUserInitialization(newState, initialize)
				})
			},
			disconnectEntity: childEntityOrItsKey => {
				// TODO disallow this if the EntityList is at the top level
				this.eventManager.syncOperation(() => {
					performOperationWithBeforeUpdate(() => {
						const disconnectedChildKey =
							typeof childEntityOrItsKey === 'string' ? childEntityOrItsKey : childEntityOrItsKey.key

						const disconnectedChildState = this.treeStore.entityStore.get(disconnectedChildKey)
						if (disconnectedChildState === undefined) {
							throw new BindingError(
								`EntityListAccessor: Cannot remove entity with key '${disconnectedChildKey}' as it doesn't exist.`,
							)
						}

						if (!entityListState.children.has(disconnectedChildState)) {
							throw new BindingError(
								`Entity list doesn't include an entity with key '${disconnectedChildKey}' and so it cannot remove it.`,
							)
						}
						const didDelete = disconnectedChildState.realms.delete(entityListState.onChildEntityUpdate)
						if (!didDelete) {
							this.rejectInvalidAccessorTree()
						}
						if (entityListState.persistedEntityIds.has(disconnectedChildKey)) {
							if (entityListState.plannedRemovals === undefined) {
								entityListState.plannedRemovals = new Map()
							}
							entityListState.plannedRemovals.set(disconnectedChildState, 'disconnect')
						}

						if (entityListState.persistedEntityIds.has(disconnectedChildKey)) {
							this.dirtinessTracker.increment()
						} else {
							// It wasn't on the list, then it was, and now we're removing it again.
							this.dirtinessTracker.decrement()
						}

						entityListState.children.delete(disconnectedChildState)
						entityListState.hasPendingParentNotification = true
						entityListState.hasStaleAccessor = true
					})
				})
			},
			getChildEntityByKey: key => {
				const childState = this.treeStore.entityStore.get(key)
				if (childState === undefined || !entityListState.children.has(childState)) {
					throw new BindingError(`EntityList: cannot retrieve an entity with key '${key}' as it is not on the list.`)
				}
				return childState.getAccessor()
			},
		}
		entityListState.addEventListener = this.getAddEventListener(entityListState)

		const batchUpdatesImplementation: EntityListAccessor.BatchUpdates = performUpdates => {
			entityListState.batchUpdateDepth++
			performUpdates(entityListState.getAccessor, this.bindingOperations)
			entityListState.batchUpdateDepth--

			if (
				entityListState.batchUpdateDepth === 0 &&
				!entityListState.hasPendingUpdate && // We must have already told the parent if this is true.
				entityListState.hasPendingParentNotification
			) {
				entityListState.hasPendingUpdate = true
				entityListState.hasPendingParentNotification = false
				entityListState.onEntityListUpdate(entityListState)
			}
		}

		const performOperationWithBeforeUpdate = (operation: () => void) => {
			batchUpdatesImplementation(getAccessor => {
				operation()

				if (
					!entityListState.hasPendingParentNotification || // That means the operation hasn't done anything.
					entityListState.eventListeners.beforeUpdate === undefined ||
					entityListState.eventListeners.beforeUpdate.size === 0
				) {
					return
				}

				let currentAccessor: EntityListAccessor
				for (let i = 0; i < this.config.getValue('beforeUpdateSettleLimit'); i++) {
					currentAccessor = getAccessor()
					for (const listener of entityListState.eventListeners.beforeUpdate) {
						listener(getAccessor, this.bindingOperations)
					}
					if (currentAccessor === getAccessor()) {
						return
					}
				}
				throw new BindingError(
					`EntityAccessor beforeUpdate event: maximum stabilization limit exceeded. ` +
						`This likely means an infinite feedback loop in your code.`,
				)
			})
		}

		const processEntityDeletion = (stateForDeletion: EntityState) => {
			// We don't remove entities from the store so as to allow their re-connection.
			entityListState.childrenWithPendingUpdates?.delete(stateForDeletion)

			const key = stateForDeletion.id.value
			entityListState.children.delete(stateForDeletion)
			entityListState.hasPendingParentNotification = true

			if (!stateForDeletion.id.existsOnServer) {
				return
			}

			if (entityListState.plannedRemovals === undefined) {
				entityListState.plannedRemovals = new Map()
			}
			entityListState.plannedRemovals.set(stateForDeletion, 'delete')
		}

		const generateNewEntityState = (persistedId: string | undefined): EntityState => {
			const id = persistedId === undefined ? new UnpersistedEntityKey() : new ServerGeneratedUuid(persistedId)

			const entityState = this.initializeEntityAccessor(
				id,
				entityListState.environment,
				entityListState.markersContainer,
				entityListState.creationParameters,
				entityListState.onChildEntityUpdate,
				this.eventManager.getEventListenersForListEntity(entityListState),
			)

			entityListState.hasStaleAccessor = true
			entityListState.children.add(entityState)

			return entityState
		}

		const initialData: Set<string | undefined> =
			persistedEntityIds.size === 0
				? new Set(Array.from({ length: creationParameters.initialEntityCount }))
				: persistedEntityIds
		for (const entityId of initialData) {
			generateNewEntityState(entityId)
		}

		return entityListState
	}

	private initializeFieldAccessor(
		placeholderName: FieldName,
		fieldMarker: FieldMarker,
		onFieldUpdate: OnFieldUpdate,
		persistedValue: Scalar | undefined,
	): FieldState {
		const resolvedFieldValue = persistedValue ?? fieldMarker.defaultValue ?? null

		const fieldState: FieldState = {
			type: StateType.Field,
			fieldMarker,
			onFieldUpdate,
			placeholderName,
			persistedValue,
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
							fieldState.isTouchedBy,
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
			updateValue: (
				newValue: Scalar | GraphQlBuilder.Literal,
				{ agent = FieldAccessor.userAgent }: FieldAccessor.UpdateOptions = {},
			) => {
				this.eventManager.syncOperation(() => {
					if (__DEV_MODE__) {
						if (
							placeholderName === PRIMARY_KEY_NAME &&
							newValue !== fieldState.value &&
							fieldState.touchLog !== undefined
						) {
							throw new BindingError(
								`Trying to set the '${PRIMARY_KEY_NAME}' field for the second time. This is prohibited.\n` +
									`Once set, it is immutable.`,
							)
						}
					}
					if (__DEV_MODE__) {
						if (placeholderName === PRIMARY_KEY_NAME) {
							if (typeof newValue !== 'string' || !uuidValidate(newValue)) {
								throw new BindingError(
									`Invalid value supplied for the '${PRIMARY_KEY_NAME}' field. ` +
										`Expecting a valid uuid but '${newValue}' was given.\n` +
										`Hint: you may use 'FieldAccessor.asUuid.setToUuid()'.`,
								)
							}
							if (this.treeStore.entityStore.has(newValue)) {
								throw new BindingError(
									`Trying to set the '${PRIMARY_KEY_NAME}' field to '${newValue}' which is a valid uuid but is not unique. ` +
										`It is already in use by an existing entity.`,
								)
							}
						}
					}
					if (newValue === fieldState.value) {
						return
					}
					if (fieldState.touchLog === undefined) {
						fieldState.touchLog = new Map()
					}
					fieldState.touchLog.set(agent, true)
					fieldState.value = newValue
					fieldState.hasPendingUpdate = true
					fieldState.hasStaleAccessor = true

					const resolvedValue =
						fieldState.fieldMarker.defaultValue === undefined
							? newValue
							: newValue === null
							? fieldState.fieldMarker.defaultValue
							: newValue
					const normalizedValue = resolvedValue instanceof GraphQlBuilder.Literal ? resolvedValue.value : resolvedValue
					const normalizedPersistedValue = fieldState.persistedValue === undefined ? null : fieldState.persistedValue
					const hadUnpersistedChangesBefore = fieldState.hasUnpersistedChanges
					const hasUnpersistedChangesNow = normalizedValue !== normalizedPersistedValue
					fieldState.hasUnpersistedChanges = hasUnpersistedChangesNow

					// TODO if the entity only has nonbearing fields, this should be true.
					const shouldInfluenceUpdateCount =
						!fieldState.fieldMarker.isNonbearing || fieldState.persistedValue !== undefined

					if (shouldInfluenceUpdateCount) {
						if (!hadUnpersistedChangesBefore && hasUnpersistedChangesNow) {
							this.dirtinessTracker.increment()
						} else if (hadUnpersistedChangesBefore && !hasUnpersistedChangesNow) {
							this.dirtinessTracker.decrement()
						}
					}

					fieldState.onFieldUpdate(fieldState)

					// Deliberately firing this *AFTER* letting the parent know.
					// Listeners are likely to invoke a parent's batchUpdates, and so the parents should be up to date.
					if (fieldState.eventListeners.beforeUpdate) {
						for (const listener of fieldState.eventListeners.beforeUpdate) {
							listener(fieldState.getAccessor())
						}
					}
				})
			},
			isTouchedBy: (agent: string) =>
				fieldState.touchLog === undefined ? false : fieldState.touchLog.get(agent) || false,
		}
		fieldState.addEventListener = this.getAddEventListener(fieldState)
		return fieldState
	}

	private rejectInvalidAccessorTree(): never {
		throw new BindingError(
			`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
		)
	}

	private markChildStateInNeedOfUpdate(entityListState: EntityListState, updatedState: EntityState): void
	private markChildStateInNeedOfUpdate(entityState: EntityState, updatedState: StateNode): void
	private markChildStateInNeedOfUpdate(state: StateINode, updatedState: StateNode): void {
		if (state.childrenWithPendingUpdates === undefined) {
			state.childrenWithPendingUpdates = new Set()
		}
		state.childrenWithPendingUpdates.add(updatedState as EntityState)
	}

	private findChildPlaceholdersByState(containingState: EntityState, childState: StateNode) {
		const relevantPlaceholders = new Set<FieldName>()

		// All has one relations where this entity is present.
		for (const [placeholderName, candidateState] of containingState.fields) {
			if (candidateState === childState) {
				relevantPlaceholders.add(placeholderName)
			}
		}

		return relevantPlaceholders
	}

	private runImmediateUserInitialization(
		newEntityState: EntityState,
		initialize: EntityAccessor.BatchUpdatesHandler | undefined,
	) {
		newEntityState.hasIdSetInStone = false
		initialize && newEntityState.batchUpdates(initialize)

		if (!newEntityState.eventListeners.initialize) {
			newEntityState.hasIdSetInStone = true
		}
	}

	private initializeFromFieldMarker(
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
			const fieldState = this.initializeFieldAccessor(
				field.placeholderName,
				field,
				entityState.onChildFieldUpdate,
				fieldDatum,
			)
			entityState.fields.set(field.placeholderName, fieldState)
		}
	}

	private initializeFromHasOneRelationMarker(
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
			const referenceEntityState = this.initializeEntityAccessor(
				entityId,
				field.environment,
				field.fields,
				field.relation,
				entityState.onChildFieldUpdate,
				field.relation,
			)
			entityState.fields.set(field.placeholderName, referenceEntityState)
		} else {
			throw new BindingError(
				`Received a scalar value for field '${relation.field}' where a single entity was expected.` +
					`Perhaps you meant to use a variant of <Field />?`,
			)
		}
	}

	private initializeFromHasManyRelationMarker(
		entityState: EntityState,
		field: HasManyRelationMarker,
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		const relation = field.relation

		if (fieldDatum === undefined || fieldDatum instanceof Set) {
			entityState.fields.set(
				field.placeholderName,
				this.initializeEntityListAccessor(
					field.environment,
					field.fields,
					relation,
					entityState.onChildFieldUpdate,
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

	private initializeEntityFields(entityState: EntityState, markersContainer: EntityFieldMarkersContainer): void {
		for (const [placeholderName, field] of markersContainer.markers) {
			const fieldDatum = entityState.persistedData?.get(placeholderName)
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
	}

	private mergeInEntityFieldsContainer(
		existingEntityState: EntityState,
		newMarkersContainer: EntityFieldMarkersContainer,
	): void {
		for (const [placeholderName, field] of newMarkersContainer.markers) {
			const fieldState = existingEntityState.fields.get(placeholderName)
			const fieldDatum = existingEntityState.persistedData?.get(placeholderName)

			if (field instanceof FieldMarker) {
				// Merge markers but don't re-initialize the state. It shouldn't be needed.
				if (fieldState === undefined) {
					this.initializeFromFieldMarker(existingEntityState, field, fieldDatum)
				} else if (fieldState.type === StateType.Field) {
					fieldState.fieldMarker = MarkerMerger.mergeFieldMarkers(fieldState.fieldMarker, field)
				}
			} else if (field instanceof HasOneRelationMarker) {
				if (fieldState === undefined || fieldState.type === StateType.SingleEntity) {
					// This method calls initializeEntityAccessor which handles the merging on its own.
					this.initializeFromHasOneRelationMarker(existingEntityState, field, fieldDatum)
				}
			} else if (field instanceof HasManyRelationMarker) {
				if (fieldState === undefined) {
					this.initializeFromHasManyRelationMarker(existingEntityState, field, fieldDatum)
				} else if (fieldState.type === StateType.EntityList) {
					for (const childState of fieldState.children) {
						this.initializeEntityAccessor(
							childState.id,
							fieldState.environment,
							newMarkersContainer,
							fieldState.creationParameters,
							fieldState.onChildEntityUpdate,
							this.eventManager.getEventListenersForListEntity(fieldState, field),
						)
					}
					fieldState.markersContainer = MarkerMerger.mergeEntityFieldsContainers(
						fieldState.markersContainer,
						newMarkersContainer,
					)
				}
			} else if (field instanceof SubTreeMarker) {
				// Do nothing: all sub trees have been hoisted and shouldn't appear here.
			} else {
				assertNever(field)
			}
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

	private resolveAndPrepareEntityToConnect(entityToConnectOrItsKey: string | EntityAccessor): [string, EntityState] {
		let connectedEntityKey: string

		if (typeof entityToConnectOrItsKey === 'string') {
			connectedEntityKey = entityToConnectOrItsKey
		} else {
			// TODO This is commented out for now in order to at least somewhat mitigate the limitations of dealing with
			//		inverse relations. However, once that has been addressed systemically, this code needs to be re-enabled.
			// if (!entityToConnectOrItsKey.existsOnServer) {
			// 	throw new BindingError(
			// 		`Attempting to connect an entity with key '${entityToConnectOrItsKey.key}' that ` +
			// 			`doesn't exist on server. That is currently impossible.`, // At least for now.
			// 	)
			// }
			connectedEntityKey = entityToConnectOrItsKey.key
		}

		const connectedState = this.treeStore.entityStore.get(connectedEntityKey)
		if (connectedState === undefined) {
			throw new BindingError(`Attempting to connect an entity with key '${connectedEntityKey}' but it doesn't exist.`)
		}
		if (connectedState.isScheduledForDeletion) {
			// As far as the other realms are concerned, this entity is deleted. We don't want to just make it re-appear
			// for them just because some other random relation decided to connect it.
			connectedState.realms.clear()
			connectedState.isScheduledForDeletion = false
		}

		return [connectedEntityKey, connectedState]
	}
}
