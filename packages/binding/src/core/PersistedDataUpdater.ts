import { NormalizedQueryResponseData, ServerGeneratedUuid, UnpersistedEntityKey } from '../accessorTree'
import { HasOneRelationMarker } from '../markers'
import { BoxedQualifiedSingleEntity } from '../treeParameters'
import { assertNever } from '../utils'
import { EventManager } from './EventManager'
import { EntityListState, EntityState, StateType } from './state'
import { StateInitializer } from './StateInitializer'
import { TreeStore } from './TreeStore'

export class PersistedDataUpdater {
	public constructor(
		private readonly eventManager: EventManager,
		private readonly stateInitializer: StateInitializer,
		private readonly treeStore: TreeStore,
	) {}

	public updatePersistedData(normalizedResponse: NormalizedQueryResponseData) {
		this.eventManager.syncOperation(() => {
			this.treeStore.persistedEntityData = normalizedResponse.persistedEntityDataStore

			const alreadyProcessed: Set<EntityState> = new Set()

			let didUpdateSomething = false
			for (const [subTreePlaceholder, subTreeState] of this.treeStore.subTreeStates) {
				const newSubTreeData = normalizedResponse.subTreeDataStore.get(subTreePlaceholder)

				if (subTreeState.type === StateType.Entity) {
					if (newSubTreeData instanceof ServerGeneratedUuid) {
						if (newSubTreeData.value === subTreeState.id.value) {
							didUpdateSomething =
								didUpdateSomething ||
								this.updateSingleEntityPersistedData(alreadyProcessed, subTreeState, newSubTreeData)
						} else {
							const newSubTreeState = this.stateInitializer.initializeEntityAccessor(
								newSubTreeData,
								subTreeState.environment,
								subTreeState.combinedMarkersContainer, // TODO this is wrong - we need to take it from a realm
								subTreeState.combinedCreationParameters, // TODO this is wrong - we need to take it from a realm
								subTreeState.onChildFieldUpdate,
								(this.treeStore.markerTree.subTrees.get(subTreePlaceholder)?.parameters as
									| BoxedQualifiedSingleEntity
									| undefined)?.value,
							)
							newSubTreeState.hasPendingUpdate = true
							this.treeStore.subTreeStates.set(subTreePlaceholder, newSubTreeState)
							didUpdateSomething = true
						}
					}
				} else if (subTreeState.type === StateType.EntityList) {
					if (newSubTreeData instanceof Set) {
						didUpdateSomething =
							didUpdateSomething || this.updateEntityListPersistedData(alreadyProcessed, subTreeState, newSubTreeData)
					}
				} else {
					assertNever(subTreeState)
				}
			}
			// TODO was this ever even necessary?
			// if (!didUpdateSomething) {
			// 	this.updateTreeRoot() // Still force an update, albeit without update events.
			// }
		})
	}

	private updateSingleEntityPersistedData(
		alreadyProcessed: Set<EntityState>,
		state: EntityState,
		newPersistedId: ServerGeneratedUuid,
	): boolean {
		if (alreadyProcessed.has(state)) {
			return false
		}
		alreadyProcessed.add(state)

		// TODO this entire process needs to also update realms!
		let didUpdate = false

		if (state.plannedHasOneDeletions?.size) {
			state.plannedHasOneDeletions.clear()
			didUpdate = true
		}

		if (!(state.id instanceof ServerGeneratedUuid) || newPersistedId.value !== state.id.value) {
			state.id = newPersistedId
			state.maidenKey = undefined
			state.hasIdSetInStone = true
			didUpdate = true
		}

		if (state.childrenWithPendingUpdates) {
			for (const child of state.childrenWithPendingUpdates) {
				if (child.type === StateType.Entity && !child.id.existsOnServer) {
					state.childrenWithPendingUpdates.delete(child) // We should delete it completely.
					didUpdate = true
				}
			}
		}

		const newPersistedData = this.treeStore.persistedEntityData.get(state.id.value)

		for (let [fieldPlaceholder, fieldState] of state.fields) {
			let didChildUpdate = false
			const newFieldDatum = newPersistedData?.get(fieldPlaceholder)

			switch (fieldState.type) {
				case StateType.Field: {
					if (!(newFieldDatum instanceof Set) && !(newFieldDatum instanceof ServerGeneratedUuid)) {
						if (fieldState.persistedValue !== newFieldDatum) {
							fieldState.persistedValue = newFieldDatum
							fieldState.value = newFieldDatum ?? fieldState.fieldMarker.defaultValue ?? null
							fieldState.hasUnpersistedChanges = false

							didChildUpdate = true
						}
					}
					break
				}
				case StateType.Entity: {
					const marker = state.combinedMarkersContainer.markers.get(fieldPlaceholder)

					if (!(marker instanceof HasOneRelationMarker)) {
						break
					}

					let shouldInitializeNewEntity = false
					const previousFieldDatum = state.persistedData?.get(fieldPlaceholder)
					if (newFieldDatum instanceof ServerGeneratedUuid) {
						if (previousFieldDatum instanceof ServerGeneratedUuid) {
							if (newFieldDatum.value === previousFieldDatum.value && newFieldDatum.value === fieldState.id.value) {
								// Updating an entity that already existed on the server.
								didChildUpdate = this.updateSingleEntityPersistedData(alreadyProcessed, fieldState, newFieldDatum)
							} else {
								// An entity still exists on the server but got re-connected.
								shouldInitializeNewEntity = true
							}
						} else if (previousFieldDatum === null || previousFieldDatum === undefined) {
							// This entity got created/connected.
							shouldInitializeNewEntity = true
						}
					} else if (newFieldDatum === null || newFieldDatum === undefined) {
						if (previousFieldDatum instanceof ServerGeneratedUuid) {
							// This entity got deleted/disconnected.
							shouldInitializeNewEntity = true
						} else if (previousFieldDatum === null || previousFieldDatum === undefined) {
							// This entity remained untouched.
							shouldInitializeNewEntity = true
						}
					}

					if (shouldInitializeNewEntity) {
						state.fields.set(
							fieldPlaceholder,
							(fieldState = this.stateInitializer.initializeEntityAccessor(
								newFieldDatum instanceof ServerGeneratedUuid ? newFieldDatum : new UnpersistedEntityKey(),
								marker.environment,
								marker.fields,
								marker.relation,
								state.onChildFieldUpdate,
								marker.relation,
							)),
						)
						this.eventManager.markPendingConnections(state, new Set([fieldPlaceholder]))
						alreadyProcessed.add(fieldState)
						didChildUpdate = true
					}

					break
				}
				case StateType.EntityList: {
					if (newFieldDatum instanceof Set || newFieldDatum === undefined) {
						didChildUpdate = this.updateEntityListPersistedData(
							alreadyProcessed,
							fieldState,
							newFieldDatum || new Set(),
						)
					}
					break
				}
				default:
					assertNever(fieldState)
			}

			if (didChildUpdate) {
				if (state.childrenWithPendingUpdates === undefined) {
					state.childrenWithPendingUpdates = new Set()
				}
				fieldState.hasPendingUpdate = true
				fieldState.hasStaleAccessor = true
				state.childrenWithPendingUpdates.add(fieldState)
				didUpdate = true
			}
		}

		if (didUpdate) {
			state.persistedData = newPersistedData
			state.hasStaleAccessor = true
			state.hasPendingUpdate = true
		}
		return didUpdate
	}

	private updateEntityListPersistedData(
		alreadyProcessed: Set<EntityState>,
		state: EntityListState,
		newPersistedData: Set<string>,
	): boolean {
		let didUpdate = false

		if (state.plannedRemovals?.size) {
			state.plannedRemovals.clear()
			didUpdate = true
		}

		if (state.childrenWithPendingUpdates) {
			for (const child of state.childrenWithPendingUpdates) {
				if (!child.id.existsOnServer) {
					state.childrenWithPendingUpdates.delete(child) // We should delete it completely.
					didUpdate = true
				}
			}
		}

		let haveSameKeySets = state.children.size === newPersistedData.size

		if (haveSameKeySets) {
			const newKeyIterator = newPersistedData[Symbol.iterator]()
			for (const childState of state.children) {
				const oldKey = childState.id.value
				if (!newPersistedData.has(oldKey)) {
					haveSameKeySets = false
					// TODO delete the corresponding state
				}
				// We also check the order
				const newKeyResult = newKeyIterator.next()
				if (!newKeyResult.done && newKeyResult.value !== oldKey) {
					haveSameKeySets = false
				}
			}
		}
		if (!haveSameKeySets) {
			didUpdate = true
		}

		state.persistedEntityIds = newPersistedData

		const initialData: Set<string | undefined> =
			newPersistedData.size > 0
				? newPersistedData
				: new Set(Array.from({ length: state.creationParameters.initialEntityCount }))

		state.children.clear()

		// TODO instead of calling initializeEntityAccessor we might be able to perform some Longest Common Subsequence
		// 	wizardry and match the id sets in order to convert the unpersisted
		for (const newPersistedId of initialData) {
			if (newPersistedId === undefined) {
				const newKey = new UnpersistedEntityKey()

				const childState = this.stateInitializer.initializeEntityAccessor(
					newKey,
					state.environment,
					state.markersContainer,
					state.creationParameters,
					state.onChildEntityUpdate,
					this.eventManager.getEventListenersForListEntity(state),
				)
				state.children.add(childState)

				didUpdate = true
			} else {
				let childState = this.treeStore.entityStore.get(newPersistedId)

				if (childState === undefined) {
					childState = this.stateInitializer.initializeEntityAccessor(
						new ServerGeneratedUuid(newPersistedId),
						state.environment,
						state.markersContainer,
						state.creationParameters,
						state.onChildEntityUpdate,
						this.eventManager.getEventListenersForListEntity(state),
					)
					didUpdate = true
				} else {
					const didChildUpdate = this.updateSingleEntityPersistedData(
						alreadyProcessed,
						childState,
						new ServerGeneratedUuid(newPersistedId),
					)

					if (didChildUpdate) {
						didUpdate = true
						if (state.childrenWithPendingUpdates === undefined) {
							state.childrenWithPendingUpdates = new Set()
						}
						state.childrenWithPendingUpdates.add(childState)
					}
				}
				state.children.add(childState)
			}
		}

		if (didUpdate) {
			state.hasStaleAccessor = true
			state.hasPendingUpdate = true
		}
		return didUpdate
	}
}
