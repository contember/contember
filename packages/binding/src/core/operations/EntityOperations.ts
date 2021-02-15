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

					let changesDelta =
						previouslyConnectedState.type === 'entityRealm' ? -1 * previouslyConnectedState.unpersistedChangesCount : 0

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

					let changesDelta =
						stateToDisconnect.type === 'entityRealm' ? -1 * stateToDisconnect.unpersistedChangesCount : 0
					const persistedId = persistedData?.get(targetHasOneMarker.placeholderName)

					if (persistedId instanceof ServerGeneratedUuid && persistedId.value === stateToDisconnect.entity.id.value) {
						changesDelta++
					} else {
						// Do nothing. Disconnecting unpersisted entities doesn't change the count.
					}

					const newEntity = this.stateInitializer.initializeEntityRealm(
						new UnpersistedEntityDummyId(),
						outerState.entity.entityName,
						stateToDisconnect.blueprint,
					)
					OperationsHelpers.runImmediateUserInitialization(this.stateInitializer, newEntity, initializeReplacement)

					this.eventManager.registerUpdatedConnection(state, targetHasOneMarker.placeholderName)
					this.eventManager.registerJustUpdated(state, changesDelta)
				}
			}
		})
	}

	public deleteEntity(state: EntityState) {
		this.eventManager.syncOperation(() => {
			state.isScheduledForDeletion = true

			for (const [, deletedRealm] of state.realms) {
				let parent: EntityRealmState | EntityRealmStateStub | EntityListState
				if (deletedRealm.blueprint.type === 'listEntity') {
					parent = deletedRealm.blueprint.parent
					parent.children.delete(state.id.value)

					if (state.id.existsOnServer) {
						if (parent.plannedRemovals === undefined) {
							parent.plannedRemovals = new Map()
						}
						parent.plannedRemovals.set(deletedRealm, 'delete')
					}
				} else if (deletedRealm.blueprint.type === 'hasOne') {
					parent = deletedRealm.blueprint.parent
					const placeholderName = deletedRealm.blueprint.marker.placeholderName

					if (state.id.existsOnServer) {
						if (parent.plannedHasOneDeletions === undefined) {
							parent.plannedHasOneDeletions = new Map()
						}
						parent.plannedHasOneDeletions.set(placeholderName, deletedRealm)
					}
					this.stateInitializer.initializeEntityRealm(
						new UnpersistedEntityDummyId(),
						state.entityName,
						deletedRealm.blueprint,
					)

					this.eventManager.registerUpdatedConnection(parent, placeholderName)
				} else if (deletedRealm.blueprint.type === 'subTree') {
					throw new BindingError('Deleting top-level entities is not yet implemented.')
				} else {
					return assertNever(deletedRealm.blueprint)
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

	private *resolveHasOneRelationMarkers(
		container: EntityFieldMarkersContainer,
		field: FieldName,
		message: string,
	): Generator<HasOneRelationMarker, void, undefined> {
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
