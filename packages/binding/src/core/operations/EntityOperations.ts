import { BindingOperations, EntityAccessor } from '../../accessors'
import { ServerGeneratedUuid, UnpersistedEntityDummyId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { EntityFieldMarkersContainer, HasOneRelationMarker } from '../../markers'
import { FieldName } from '../../treeParameters'
import { assertNever } from '../../utils'
import { EventManager } from '../EventManager'
import { ErrorLocator, LocalizedBindingError } from '../exceptions'
import { MarkerComparator } from '../MarkerComparator'
import {
	EntityListState,
	EntityRealmState,
	EntityRealmStateStub,
	EntityState,
	getEntityMarker,
	StateIterator,
	StateType,
} from '../state'
import { StateInitializer } from '../StateInitializer'
import { TreeStore } from '../TreeStore'
import { OperationsHelpers } from './OperationsHelpers'

export class EntityOperations {
	public constructor(
		private readonly bindingOperations: BindingOperations,
		private readonly eventManager: EventManager,
		private readonly stateInitializer: StateInitializer,
		private readonly treeStore: TreeStore,
	) {}

	public addEventListener(state: EntityRealmState, type: EntityAccessor.EntityEventType, ...args: unknown[]) {
		if (type === 'connectionUpdate') {
			if (state.eventListeners.connectionUpdate === undefined) {
				state.eventListeners.connectionUpdate = new Map()
			}
			const fieldName = args[0] as FieldName
			const listener = args[1] as EntityAccessor.UpdateListener
			const existingListeners = state.eventListeners.connectionUpdate.get(fieldName)

			if (existingListeners === undefined) {
				state.eventListeners.connectionUpdate.set(fieldName, new Set([listener]))
			} else {
				existingListeners.add(listener)
			}
			return () => {
				const existingListeners = state.eventListeners.connectionUpdate?.get(fieldName)
				if (existingListeners === undefined) {
					return // Throw an error? This REALLY should not happen.
				}
				existingListeners.delete(listener)
			}
		} else {
			const listener = args[0] as EntityAccessor.EntityEventListenerMap[typeof type]
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

	public batchUpdates(state: EntityRealmState, performUpdates: EntityAccessor.BatchUpdatesHandler) {
		this.eventManager.syncOperation(() => {
			performUpdates(state.getAccessor, this.bindingOperations)
		})
	}

	public connectEntityAtField(outerState: EntityRealmState, fieldName: FieldName, entityToConnect: EntityAccessor) {
		this.eventManager.syncOperation(() => {
			const stateToConnect = OperationsHelpers.resolveAndPrepareEntityToConnect(this.treeStore, entityToConnect)
			const fieldsToConnect = getEntityMarker(stateToConnect).fields
			const persistedData = this.treeStore.persistedEntityData.get(outerState.entity.id.value)

			const entityName = outerState.entity.entityName
			const fieldSchema = this.treeStore.schema.getEntityField(entityName, fieldName)

			if (fieldSchema === undefined) {
				throw new BindingError(
					`EntityAccessor.connectEntityAtField: Unknown field ${entityName}.${fieldName}.\n\n` +
						`Entity located at: ${ErrorLocator.locateInternalState(outerState)}.`,
				)
			} else if (fieldSchema.__typename === '_Column') {
				throw new BindingError(
					`EntityAccessor.connectEntityAtField: Cannot connect at field ${entityName}.${fieldName} because ` +
						`it's not a has-one relation.\n\n` +
						`Entity located at: ${ErrorLocator.locateInternalState(outerState)}.`,
				)
			}

			for (const state of StateIterator.eachSiblingRealm(outerState)) {
				const targetHasOneMarkers = this.resolveHasOneRelationMarkers(
					getEntityMarker(state).fields,
					fieldName,
					`Cannot connect at field '${fieldName}' as it doesn't refer to a has one relation.`,
				)
				for (const targetHasOneMarker of targetHasOneMarkers) {
					const previouslyConnectedState = state.children.get(targetHasOneMarker.placeholderName)

					if (
						previouslyConnectedState === undefined ||
						previouslyConnectedState.type === StateType.Field ||
						previouslyConnectedState.type === StateType.EntityList
					) {
						OperationsHelpers.rejectInvalidAccessorTree()
					}

					if (previouslyConnectedState === stateToConnect) {
						continue // Do nothing.
					}

					if (previouslyConnectedState.entity.entityName !== stateToConnect.entity.entityName) {
						throw new BindingError(
							`EntityAccessor.connectEntityAtField: Attempting to connect at field ${entityName}.${fieldName} ` +
								`an entity of type '${stateToConnect.entity.entityName}' but ` +
								`'${previouslyConnectedState.entity.entityName}' is expected.\n\n` +
								`Entity located at: ${ErrorLocator.locateInternalState(outerState)}.`,
						)
					}

					try {
						MarkerComparator.assertEntityMarkersSubsetOf(targetHasOneMarker.fields, fieldsToConnect)
					} catch (error) {
						if (error instanceof LocalizedBindingError) {
							throw new BindingError(
								`EntityAccessor: cannot connect entity with key '${entityToConnect.key}' because its fields are` +
									`incompatible with entities found at field '${fieldName}'. Make sure both trees are equivalent.\n\n` +
									`${error.message}\n\n` +
									(error.markerPath.length > 1
										? `Incompatibility found at: ${ErrorLocator.locateMarkerPath(error.markerPath)}.\n\n`
										: '') +
									`Entity located at: ${ErrorLocator.locateInternalState(state)}.`,
							)
						}
						throw error
					}

					// TODO remove from planned deletions if appropriate

					this.treeStore.disposeOfRealm(previouslyConnectedState)

					let changesDelta = 0

					if (previouslyConnectedState.type === 'entityRealm') {
						changesDelta -= previouslyConnectedState.unpersistedChangesCount
					}

					const persistedId = persistedData?.get(targetHasOneMarker.placeholderName)
					if (persistedId instanceof ServerGeneratedUuid) {
						if (persistedId.value === stateToConnect.entity.id.value) {
							changesDelta-- // It was removed from the list but now we're adding it back.
						} else if (persistedId.value === previouslyConnectedState.entity.id.value) {
							changesDelta++ // We're changing it from the persisted id.
						}
					} else if (!previouslyConnectedState.entity.id.existsOnServer) {
						// This assumes the invariant enforced above that we cannot connect unpersisted entities.
						// Hence the previouslyConnectedState still refers to the entity created initially.

						if (
							persistedId === null || // We're updating.
							(persistedId === undefined && // We're creating.
								(!fieldsToConnect.hasAtLeastOneBearingField || !targetHasOneMarker.parameters.isNonbearing))
						) {
							changesDelta++
						}
					}

					// TODO do something about the existing state…

					this.stateInitializer.initializeEntityRealm(
						stateToConnect.entity.id,
						stateToConnect.entity.entityName,
						previouslyConnectedState.blueprint,
					)

					this.eventManager.registerUpdatedConnection(state, targetHasOneMarker.placeholderName)
					this.eventManager.registerJustUpdated(state, changesDelta)
				}
			}
		})
	}

	public disconnectEntityAtField(
		outerState: EntityRealmState,
		fieldName: FieldName,
		initializeReplacement: EntityAccessor.BatchUpdatesHandler | undefined,
	) {
		this.eventManager.syncOperation(() => {
			const persistedData = this.treeStore.persistedEntityData.get(outerState.entity.id.value)

			for (const state of StateIterator.eachSiblingRealm(outerState)) {
				const targetHasOneMarkers = this.resolveHasOneRelationMarkers(
					getEntityMarker(state).fields,
					fieldName,
					`Cannot disconnect at field '${fieldName}' as it doesn't refer to a has one relation.`,
				)
				for (const targetHasOneMarker of targetHasOneMarkers) {
					const stateToDisconnect = state.children.get(targetHasOneMarker.placeholderName)

					if (
						stateToDisconnect === undefined ||
						(stateToDisconnect.type !== StateType.EntityRealm && stateToDisconnect.type !== StateType.EntityRealmStub)
					) {
						OperationsHelpers.rejectInvalidAccessorTree()
					}

					this.treeStore.disposeOfRealm(stateToDisconnect)

					let changesDelta = 0

					if (stateToDisconnect.type === 'entityRealm') {
						changesDelta -= stateToDisconnect.unpersistedChangesCount
					}
					const persistedId = persistedData?.get(targetHasOneMarker.placeholderName)

					if (persistedId instanceof ServerGeneratedUuid && persistedId.value === stateToDisconnect.entity.id.value) {
						changesDelta++
					} else {
						// Do nothing. Disconnecting unpersisted entities doesn't change the count.
					}

					const newEntity = this.stateInitializer.initializeEntityRealm(
						new UnpersistedEntityDummyId(),
						stateToDisconnect.entity.entityName,
						stateToDisconnect.blueprint,
					)
					OperationsHelpers.runImmediateUserInitialization(this.stateInitializer, newEntity, initializeReplacement)

					this.eventManager.registerUpdatedConnection(state, targetHasOneMarker.placeholderName)
					this.eventManager.registerJustUpdated(state, changesDelta)
				}
			}
		})
	}

	public deleteEntity(outerState: EntityState) {
		this.eventManager.syncOperation(() => {
			outerState.isScheduledForDeletion = true

			const entityId = outerState.id

			for (const realmToDelete of outerState.realms.values()) {
				let parent: EntityRealmState | EntityRealmStateStub | EntityListState
				let changesDelta = 0

				if (realmToDelete.blueprint.type === 'listEntity') {
					parent = realmToDelete.blueprint.parent
					parent.children.delete(entityId.value)

					if (entityId.existsOnServer) {
						if (parent.plannedRemovals === undefined) {
							parent.plannedRemovals = new Map()
						}
						changesDelta++
						parent.plannedRemovals.set(realmToDelete, 'delete')
					}
				} else if (realmToDelete.blueprint.type === 'hasOne') {
					parent = realmToDelete.blueprint.parent
					const placeholderName = realmToDelete.blueprint.marker.placeholderName

					if (entityId.existsOnServer) {
						if (parent.plannedHasOneDeletions === undefined) {
							parent.plannedHasOneDeletions = new Map()
						}
						changesDelta++
						parent.plannedHasOneDeletions.set(placeholderName, realmToDelete)
					}
					this.stateInitializer.initializeEntityRealm(
						new UnpersistedEntityDummyId(),
						outerState.entityName,
						realmToDelete.blueprint,
					)

					this.eventManager.registerUpdatedConnection(parent, placeholderName)
				} else if (realmToDelete.blueprint.type === 'subTree') {
					throw new BindingError('Deleting top-level entities is not yet implemented.')
				} else {
					return assertNever(realmToDelete.blueprint)
				}

				if (realmToDelete.type === StateType.EntityRealm) {
					// Undoing whatever this had caused
					changesDelta -= realmToDelete.unpersistedChangesCount
				}
				this.eventManager.registerJustUpdated(parent, changesDelta)

				// TODO connection update?

				if (realmToDelete.type === StateType.EntityRealm) {
					parent.childrenWithPendingUpdates?.delete(realmToDelete)
				}
			}
		})
	}

	private *resolveHasOneRelationMarkers(
		container: EntityFieldMarkersContainer,
		field: FieldName,
		message: string,
	): IterableIterator<HasOneRelationMarker> {
		const placeholders = container.placeholders.get(field)

		if (placeholders === undefined) {
			return
		}
		const normalizedPlaceholders = placeholders instanceof Set ? placeholders : [placeholders]

		for (const placeholderName of normalizedPlaceholders) {
			const hasOneRelation = container.markers.get(placeholderName)

			if (!(hasOneRelation instanceof HasOneRelationMarker)) {
				throw new BindingError(message)
			}
			yield hasOneRelation
		}
	}
}
