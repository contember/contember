import { BindingOperations, EntityAccessor } from '../../accessors'
import { ClientGeneratedUuid, ServerGeneratedUuid, UnpersistedEntityDummyId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { PRIMARY_KEY_NAME } from '../../bindingTypes'
import {
	EntityFieldMarkersContainer,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	SubTreeMarker,
} from '../../markers'
import { FieldName } from '../../treeParameters/primitives'
import { assertNever } from '../../utils'
import { EventManager } from '../EventManager'
import { MarkerMerger } from '../MarkerMerger'
import { EntityRealmBlueprint, EntityRealmState, EntityState, StateNode, StateType } from '../state'
import { StateInitializer } from '../StateInitializer'
import { TreeParameterMerger } from '../TreeParameterMerger'
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

	// public connectEntityAtField(
	// 	state: EntityRealmState,
	// 	fieldName: FieldName,
	// 	entityToConnectOrItsKey: EntityAccessor | string,
	// ) {
	// 	this.eventManager.syncOperation(() => {
	// 		this.batchUpdatesImplementation(state, () => {
	// 			const hasOneMarkers = this.resolveHasOneRelationMarkers(
	// 				state,
	// 				fieldName,
	// 				`Cannot connect at field '${fieldName}' as it doesn't refer to a has one relation.`,
	// 			)
	// 			for (const hasOneMarker of hasOneMarkers) {
	// 				const previouslyConnectedState = state.children.get(hasOneMarker.placeholderName)
	//
	// 				if (
	// 					previouslyConnectedState === undefined ||
	// 					previouslyConnectedState.type === StateType.Field ||
	// 					previouslyConnectedState.type === StateType.EntityList
	// 				) {
	// 					OperationsHelpers.rejectInvalidAccessorTree()
	// 				}
	//
	// 				const [entityToConnectKey, stateToConnect] = OperationsHelpers.resolveAndPrepareEntityToConnect(
	// 					this.treeStore,
	// 					entityToConnectOrItsKey,
	// 				)
	//
	// 				if (previouslyConnectedState === stateToConnect) {
	// 					return // Do nothing.
	// 				}
	// 				// TODO remove from planned deletions if appropriate
	//
	// 				const persistedKey = state.persistedData?.get(hasOneMarker.placeholderName)
	// 				if (persistedKey instanceof ServerGeneratedUuid) {
	// 					if (persistedKey.value === entityToConnectKey) {
	// 						this.dirtinessTracker.decrement() // It was removed from the list but now we're adding it back.
	// 					} else if (persistedKey.value === previouslyConnectedState.id.value) {
	// 						this.dirtinessTracker.increment() // We're changing it from the persisted id.
	// 					}
	// 				} else if (!previouslyConnectedState.id.existsOnServer) {
	// 					// This assumes the invariant enforced above that we cannot connect unpersisted entities.
	// 					// Hence the previouslyConnectedState still refers to the entity created initially.
	//
	// 					if (
	// 						persistedKey === null || // We're updating.
	// 						(persistedKey === undefined && // We're creating.
	// 							(!state.combinedMarkersContainer.hasAtLeastOneBearingField || !hasOneMarker.relation.isNonbearing))
	// 					) {
	// 						this.dirtinessTracker.increment()
	// 					}
	// 				}
	//
	// 				// TODO do something about the existing state…
	//
	// 				this.addEntityRealm(stateToConnect, {
	// 					creationParameters: hasOneMarker.relation,
	// 					environment: hasOneMarker.environment,
	// 					initialEventListeners: hasOneMarker.relation,
	// 					markersContainer: hasOneMarker.fields,
	// 					parent: state,
	// 					realmKey: hasOneMarker.placeholderName,
	// 				})
	// 				state.children.set(hasOneMarker.placeholderName, stateToConnect)
	// 				state.hasStaleAccessor = true
	// 				state.hasPendingParentNotification = true
	// 			}
	// 			if (state.fieldsWithPendingConnectionUpdates === undefined) {
	// 				state.fieldsWithPendingConnectionUpdates = new Set()
	// 			}
	// 			state.fieldsWithPendingConnectionUpdates.add(fieldName)
	// 		})
	// 	})
	// }

	// public disconnectEntityAtField(
	// 	state: EntityRealmState,
	// 	fieldName: FieldName,
	// 	initializeReplacement: EntityAccessor.BatchUpdatesHandler | undefined,
	// ) {
	// 	this.eventManager.syncOperation(() => {
	// 		this.batchUpdatesImplementation(state, () => {
	// 			const hasOneMarkers = this.resolveHasOneRelationMarkers(
	// 				state,
	// 				fieldName,
	// 				`Cannot disconnect the field '${fieldName}' as it doesn't refer to a has one relation.`,
	// 			)
	// 			for (const hasOneMarker of hasOneMarkers) {
	// 				const stateToDisconnect = state.children.get(hasOneMarker.placeholderName)
	//
	// 				if (stateToDisconnect === undefined) {
	// 					throw new BindingError(`Cannot disconnect field '${hasOneMarker.placeholderName}' as it doesn't exist.`)
	// 				}
	// 				if (stateToDisconnect.type !== StateType.Entity) {
	// 					OperationsHelpers.rejectInvalidAccessorTree()
	// 				}
	//
	// 				const persistedKey = state.persistedData?.get(hasOneMarker.placeholderName)
	//
	// 				if (persistedKey instanceof ServerGeneratedUuid && persistedKey.value === stateToDisconnect.id.value) {
	// 					this.dirtinessTracker.increment()
	// 				} else {
	// 					// Do nothing. Disconnecting unpersisted entities doesn't change the count.
	// 				}
	//
	// 				stateToDisconnect.realms.get(state)?.delete(hasOneMarker.placeholderName)
	//
	// 				// TODO update changes count?
	//
	// 				const newEntityState = this.stateInitializer.initializeEntityRealm(new UnpersistedEntityDummyId(), {
	// 					creationParameters: hasOneMarker.relation,
	// 					environment: hasOneMarker.environment,
	// 					initialEventListeners: hasOneMarker.relation,
	// 					markersContainer: hasOneMarker.fields,
	// 					parent: state,
	// 					realmKey: hasOneMarker.placeholderName,
	// 				})
	// 				state.children.set(hasOneMarker.placeholderName, newEntityState)
	//
	// 				state.hasStaleAccessor = true
	// 				state.hasPendingParentNotification = true
	//
	// 				OperationsHelpers.runImmediateUserInitialization(newEntityState, initializeReplacement)
	// 			}
	// 			if (state.fieldsWithPendingConnectionUpdates === undefined) {
	// 				state.fieldsWithPendingConnectionUpdates = new Set()
	// 			}
	// 			state.fieldsWithPendingConnectionUpdates.add(fieldName)
	// 		})
	// 	})
	// }

	public deleteEntity(state: EntityState) {
		this.eventManager.syncOperation(() => {
			state.isScheduledForDeletion = true

			for (const [, deletedRealm] of state.realms) {
				const parent = deletedRealm.blueprint.parent
				if (parent === undefined) {
					// TODO handle top-level entities better
					continue
				}

				if (parent.type === StateType.EntityRealm) {
					const placeholderName = deletedRealm.blueprint.placeholderName

					if (state.id.existsOnServer) {
						if (parent.plannedHasOneDeletions === undefined) {
							parent.plannedHasOneDeletions = new Map()
						}
						parent.plannedHasOneDeletions.set(placeholderName, deletedRealm)
					}
					this.stateInitializer.initializeEntityRealm(new UnpersistedEntityDummyId(), deletedRealm.blueprint)

					this.eventManager.registerUpdatedConnection(parent, placeholderName)
				} else if (parent.type === StateType.EntityList) {
					parent.children.delete(state.id.value)

					if (state.id.existsOnServer) {
						if (parent.plannedRemovals === undefined) {
							parent.plannedRemovals = new Map()
						}
						parent.plannedRemovals.set(deletedRealm, 'delete')
					}
				} else {
					assertNever(parent)
				}

				let changesDelta = 0
				if (deletedRealm.type === StateType.EntityRealmStub) {
					changesDelta = EventManager.NO_CHANGES_DIFFERENCE
				} else {
					parent.childrenWithPendingUpdates?.delete(deletedRealm)
					changesDelta = -1 * deletedRealm.unpersistedChangesCount // Undoing whatever this had caused
				}
				this.eventManager.registerJustUpdated(parent, changesDelta)
			}
		})
	}

	// public onChildUpdate(state: EntityRealmState, updatedState: StateNode) {
	// 	// No before update for child updates!
	// 	this.batchUpdatesImplementation(state, () => {
	// 		if (updatedState.type === StateType.Field && updatedState.placeholderName === PRIMARY_KEY_NAME) {
	// 			if (state.id.existsOnServer) {
	// 				throw new BindingError(
	// 					`Trying to change the id of an entity that already exists on the server. ` +
	// 						`That is strictly prohibited. Once created, an entity's id cannot be changed.`,
	// 				)
	// 			}
	// 			if (state.hasIdSetInStone) {
	// 				throw new BindingError(
	// 					`Trying to change the id of an entity at a time it's no longer allowed. ` +
	// 						`In order to change it, it needs to be set immediately after initialization of the entity.`,
	// 				)
	// 			}
	// 			const newId = new ClientGeneratedUuid(updatedState.value as string)
	// 			this.changeEntityId(state, newId)
	// 		}
	//
	// 		if (updatedState.type === StateType.Entity && updatedState.isScheduledForDeletion) {
	// 			this.processEntityDeletion(state, updatedState)
	// 		} else {
	// 			this.eventManager.registerChildInNeedOfUpdate(state, updatedState)
	// 		}
	// 		state.hasStaleAccessor = true
	// 		state.hasPendingParentNotification = true
	// 	})
	// }

	// public addEntityRealm(targetState: EntityRealmState, blueprint: EntityRealmBlueprint): EntityRealmState {
	// 	const byParent = targetState.realms.get(newRealm.parent)
	// 	if (byParent === undefined) {
	// 		targetState.realms.set(newRealm.parent, new Map([[newRealm.realmKey, newRealm]]))
	// 	} else {
	// 		const byKey = byParent.get(newRealm.realmKey)
	//
	// 		if (byKey === undefined) {
	// 			byParent.set(newRealm.realmKey, newRealm)
	// 		} else {
	// 			byParent.set(newRealm.realmKey, MarkerMerger.mergeRealms(byKey, newRealm))
	// 		}
	// 	}
	//
	// 	if (targetState.type === StateType.Entity) {
	// 		const { creationParameters, markersContainer, initialEventListeners, environment } = newRealm
	// 		targetState.combinedMarkersContainer = MarkerMerger.mergeEntityFieldsContainers(
	// 			targetState.combinedMarkersContainer,
	// 			markersContainer,
	// 		)
	// 		targetState.combinedEnvironment = MarkerMerger.mergeEnvironments(targetState.combinedEnvironment, environment)
	// 		targetState.combinedCreationParameters = {
	// 			forceCreation: targetState.combinedCreationParameters.forceCreation || creationParameters.forceCreation,
	// 			isNonbearing: targetState.combinedCreationParameters.isNonbearing && creationParameters.isNonbearing, // If either is false, it's bearing
	// 			setOnCreate: TreeParameterMerger.mergeSetOnCreate(
	// 				targetState.combinedCreationParameters.setOnCreate,
	// 				creationParameters.setOnCreate,
	// 			),
	// 		}
	// 		targetState.eventListeners = TreeParameterMerger.mergeSingleEntityEventListeners(
	// 			TreeParameterMerger.cloneSingleEntityEventListeners(targetState.eventListeners),
	// 			TreeParameterMerger.cloneSingleEntityEventListeners(initialEventListeners?.eventListeners),
	// 		)
	// 		targetState.hasStaleAccessor = true
	// 		this.mergeInEntityFieldsContainer(targetState, newRealm.markersContainer)
	//
	// 		this.eventManager.registerNewlyInitialized([targetState, newRealm])
	// 	}
	// }

	// private mergeInEntityFieldsContainer(
	// 	existingEntityState: EntityRealmState,
	// 	newMarkersContainer: EntityFieldMarkersContainer,
	// ): void {
	// 	for (const [placeholderName, field] of newMarkersContainer.markers) {
	// 		const fieldState = existingEntityState.children.get(placeholderName)
	// 		const fieldDatum = existingEntityState.persistedData?.get(placeholderName)
	//
	// 		if (field instanceof FieldMarker) {
	// 			// Merge markers but don't re-initialize the state. It shouldn't be needed.
	// 			if (fieldState === undefined) {
	// 				this.stateInitializer.initializeFromFieldMarker(existingEntityState, field, fieldDatum)
	// 			} else if (fieldState.type === StateType.Field) {
	// 				fieldState.fieldMarker = MarkerMerger.mergeFieldMarkers(fieldState.fieldMarker, field)
	// 			}
	// 		} else if (field instanceof HasOneRelationMarker) {
	// 			if (fieldState === undefined || fieldState.type === StateType.Entity) {
	// 				// This method calls initializeEntityState which handles the merging on its own.
	// 				this.stateInitializer.initializeFromHasOneRelationMarker(existingEntityState, field, fieldDatum)
	// 			}
	// 		} else if (field instanceof HasManyRelationMarker) {
	// 			if (fieldState === undefined) {
	// 				this.stateInitializer.initializeFromHasManyRelationMarker(existingEntityState, field, fieldDatum)
	// 			} else if (fieldState.type === StateType.EntityList) {
	// 				for (const [childKey, childState] of fieldState.children) {
	// 					this.stateInitializer.initializeEntityRealm(childState.id, {
	// 						environment: fieldState.environment,
	// 						markersContainer: newMarkersContainer,
	// 						creationParameters: fieldState.creationParameters,
	// 						initialEventListeners: this.eventManager.getEventListenersForListEntity(fieldState, field),
	// 						parent: fieldState,
	// 						realmKey: childKey,
	// 					})
	// 				}
	// 				fieldState.markersContainer = MarkerMerger.mergeEntityFieldsContainers(
	// 					fieldState.markersContainer,
	// 					newMarkersContainer,
	// 				)
	// 			}
	// 		} else if (field instanceof SubTreeMarker) {
	// 			// Do nothing: all sub trees have been hoisted and shouldn't appear here.
	// 		} else {
	// 			assertNever(field)
	// 		}
	// 	}
	// }

	// private batchUpdatesImplementation(state: EntityRealmState, performUpdates: EntityAccessor.BatchUpdatesHandler) {
	// 	if (state.isScheduledForDeletion) {
	// 		if (state.hasPendingUpdate) {
	// 			// If hasPendingUpdate, we've likely just deleted the entity as a part of this transaction, so don't worry
	// 			// about it and just do nothing.
	// 			return
	// 		}
	// 		throw new BindingError(`Trying to update an entity (or something within said entity) that has been deleted.`)
	// 	}
	// 	performUpdates(state.getAccessor, this.bindingOperations)
	//
	// 	if (
	// 		// We must have already told the parent if hasPendingUpdate is true. However, we may have updated the entity
	// 		// and then subsequently deleted it, in which case we want to let the parent know regardless.
	// 		(!state.hasPendingUpdate || state.isScheduledForDeletion) &&
	// 		state.hasPendingParentNotification
	// 	) {
	// 		state.hasPendingUpdate = true
	// 		state.hasPendingParentNotification = false
	// 		this.eventManager.registerJustUpdated(state)
	// 		this.eventManager.notifyParents(state)
	// 	}
	// }

	// private resolveHasOneRelationMarkers(
	// 	state: EntityRealmState,
	// 	field: FieldName,
	// 	message: string,
	// ): Set<HasOneRelationMarker> {
	// 	const placeholders = state.combinedMarkersContainer.placeholders.get(field)
	//
	// 	if (placeholders === undefined) {
	// 		throw new BindingError(message)
	// 	}
	// 	const placeholderArray = placeholders instanceof Set ? Array.from(placeholders) : [placeholders]
	//
	// 	return new Set(
	// 		placeholderArray.map(placeholderName => {
	// 			const hasOneRelation = state.combinedMarkersContainer.markers.get(placeholderName)
	//
	// 			if (!(hasOneRelation instanceof HasOneRelationMarker)) {
	// 				throw new BindingError(message)
	// 			}
	// 			return hasOneRelation
	// 		}),
	// 	)
	// }

	// public changeEntityId(entityRealm: EntityRealmState, newId: EntityAccessor.RuntimeId) {
	// 	const previousKey = entityRealm.id.value
	// 	const newKey = newId.value
	//
	// 	entityRealm.hasIdSetInStone = true
	// 	entityRealm.id = newId
	// 	this.treeStore.entityStore.delete(previousKey)
	// 	this.treeStore.entityStore.set(newKey, entityRealm)
	//
	// 	for (const [parentState] of entityRealm.realms) {
	// 		// We're touching the parents and not letting *their* onChildUpdate handle this because we really need
	// 		// to make sure this gets processed which wouldn't happen if before the id change we had told the parent
	// 		// about another update.
	// 		if (parentState?.type === StateType.Entity) {
	// 			const relevantPlaceholders = this.findChildPlaceholdersByState(parentState, entityRealm)
	// 			this.eventManager.markPendingConnections(parentState, relevantPlaceholders)
	// 		} else if (parentState?.type === StateType.EntityList) {
	// 			// This is tricky. We need to change the key but at the same time preserve the order of the entities.
	// 			// We find the index of this entity (knowing there's exactly one occurrence), then convert the children
	// 			// to an array, perform the replacement and put the data back into the map, preserving its referential
	// 			// identity.
	// 			let childIndex = -1
	// 			for (const [key] of parentState.children) {
	// 				childIndex++
	// 				if (key === previousKey) {
	// 					break
	// 				}
	// 			}
	// 			const childrenArray = Array.from(parentState.children)
	// 			childrenArray[childIndex] = [newKey, entityRealm]
	//
	// 			parentState.children.clear()
	// 			for (const [key, state] of childrenArray) {
	// 				parentState.children.set(key, state)
	// 			}
	// 		}
	// 	}
	// }

	// private findChildPlaceholdersByState(containingState: EntityRealmState, childState: StateNode) {
	// 	const relevantPlaceholders = new Set<FieldName>()
	//
	// 	// All has one relations where this entity is present.
	// 	for (const [placeholderName, candidateState] of containingState.children) {
	// 		if (candidateState === childState) {
	// 			relevantPlaceholders.add(placeholderName)
	// 		}
	// 	}
	//
	// 	return relevantPlaceholders
	// }
}
