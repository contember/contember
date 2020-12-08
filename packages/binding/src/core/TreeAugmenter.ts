import { QueryRequestResponse, ServerGeneratedUuid, UnpersistedEntityKey } from '../accessorTree'
import {
	EntityFieldMarkersContainer,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
} from '../markers'
import { assert, assertNever } from '../utils'
import { EventManager } from './EventManager'
import { MarkerMerger } from './MarkerMerger'
import { EntityListState, EntityState, EntityStateStub, StateType } from './state'
import { EntityRealmKey } from './state/EntityRealmKey'
import { EntityRealmParent } from './state/EntityRealmParent'
import { StateInitializer } from './StateInitializer'
import { TreeStore } from './TreeStore'

type AlreadyProcessed = Map<EntityRealmParent, Set<EntityRealmKey>>

export class TreeAugmenter {
	public constructor(
		private readonly eventManager: EventManager,
		private readonly stateInitializer: StateInitializer,
		private readonly treeStore: TreeStore,
	) {}

	public augmentTree(newMarkerTree: MarkerTreeRoot, newPersistedData: QueryRequestResponse | undefined) {
		this.eventManager.syncOperation(() => {
			this.treeStore.extendTree(newMarkerTree, newPersistedData)

			// TODO this whole process fails to:
			//		- Properly update realms
			//		- Update creationParameters
			//		- Update environment
			//		- Update initialEventListeners

			const alreadyProcessed: AlreadyProcessed = new Map()
			let didUpdateSomething = false
			for (const [subTreePlaceholder, newSubTreeMarker] of newMarkerTree.subTrees) {
				const completeTreeMarker = this.treeStore.markerTree.subTrees.get(subTreePlaceholder)
				const subTreeState = this.treeStore.subTreeStates.get(subTreePlaceholder)
				const newSubTreeData = this.treeStore.subTreePersistedData.get(subTreePlaceholder)

				assert(completeTreeMarker !== undefined)

				let didUpdateTree = false

				if (subTreeState === undefined) {
					this.stateInitializer.initializeSubTree(newSubTreeMarker)
					didUpdateTree = true
				} else if (subTreeState.type === StateType.Entity) {
					assert(
						newSubTreeData === null || newSubTreeData === undefined || newSubTreeData instanceof ServerGeneratedUuid,
					)

					didUpdateTree = this.updateSingleEntityPersistedData(
						alreadyProcessed,
						undefined,
						subTreePlaceholder,
						subTreeState,
						completeTreeMarker.fields,
						newSubTreeMarker.fields,
						newSubTreeData || new UnpersistedEntityKey(),
					)
				} else if (subTreeState.type === StateType.EntityList) {
					assert(newSubTreeData instanceof Set)

					didUpdateTree = this.updateEntityListPersistedData(
						alreadyProcessed,
						subTreeState,
						completeTreeMarker.fields,
						newSubTreeMarker.fields,
						newSubTreeData,
					)
				} else {
					assertNever(subTreeState)
				}
				didUpdateSomething = didUpdateSomething || didUpdateTree
			}
			// TODO use didUpdateSomething
		})
	}

	private updateSingleEntityPersistedData(
		alreadyProcessed: AlreadyProcessed,
		parent: EntityRealmParent,
		parentKey: EntityRealmKey,
		state: EntityState,
		completeMarkersContainer: EntityFieldMarkersContainer | undefined,
		newMarkersContainer: EntityFieldMarkersContainer,
		newId: ServerGeneratedUuid | UnpersistedEntityKey,
	): boolean {
		const byParent = alreadyProcessed.get(parent)
		if (byParent === undefined) {
			alreadyProcessed.set(parent, new Set([parentKey]))
		} else if (byParent.has(parentKey)) {
			return false
		} else {
			byParent.add(parentKey)
		}

		let didUpdate = false

		if (
			newId.value !== state.id.value &&
			!(newId instanceof UnpersistedEntityKey && state.id instanceof UnpersistedEntityKey)
		) {
			this.stateInitializer.changeEntityId(state, newId)
			didUpdate = true
		}

		const newPersistedData = this.treeStore.persistedEntityData.get(state.id.value)
		state.persistedData = newPersistedData

		for (let [placeholderName, marker] of newMarkersContainer.markers) {
			const completeMarker = completeMarkersContainer?.markers.get(placeholderName)
			const newFieldDatum = newPersistedData?.get(placeholderName)
			const fieldState = state.children.get(placeholderName)

			if (fieldState === undefined) {
				this.stateInitializer.initializeEntityField(
					state,
					completeMarker ? MarkerMerger.mergeMarkers(completeMarker, marker) : marker,
					newFieldDatum,
				)
				didUpdate = true
			} else {
				let didChildUpdate = false

				switch (fieldState.type) {
					case StateType.Field: {
						assert(marker instanceof FieldMarker)
						assert(!(newFieldDatum instanceof Set) && !(newFieldDatum instanceof ServerGeneratedUuid))

						if (fieldState.persistedValue !== newFieldDatum) {
							fieldState.persistedValue = newFieldDatum
							fieldState.value = newFieldDatum ?? marker.defaultValue ?? null
							fieldState.hasUnpersistedChanges = false

							didChildUpdate = true
						}
						break
					}
					case StateType.Entity: {
						assert(marker instanceof HasOneRelationMarker)
						assert(completeMarker === undefined || completeMarker instanceof HasOneRelationMarker)
						assert(
							newFieldDatum === null || newFieldDatum === undefined || newFieldDatum instanceof ServerGeneratedUuid,
						)

						didChildUpdate = this.updateSingleEntityPersistedData(
							alreadyProcessed,
							state,
							placeholderName,
							fieldState,
							completeMarker?.fields,
							marker.fields,
							newFieldDatum || new UnpersistedEntityKey(),
						)

						break
					}
					case StateType.EntityList: {
						assert(marker instanceof HasManyRelationMarker)
						assert(completeMarker === undefined || completeMarker instanceof HasManyRelationMarker)
						assert(newFieldDatum instanceof Set || newFieldDatum === undefined)
						didChildUpdate = this.updateEntityListPersistedData(
							alreadyProcessed,
							fieldState,
							completeMarker?.fields,
							marker.fields,
							newFieldDatum || new Set(),
						)
						break
					}
					case StateType.EntityStub: {
						assert(marker instanceof HasOneRelationMarker)

						const realmsByKey = fieldState.realms.get(state)
						assert(realmsByKey !== undefined)
						const realm = realmsByKey.get(parentKey)
						if (realm === undefined) {
							realmsByKey.set(parentKey, {
								parent: state,
								realmKey: parentKey,
								markersContainer: marker.fields,
								initialEventListeners: marker.relation,
								environment: marker.environment,
								creationParameters: marker.relation,
							})
						} else {
							realm.markersContainer = MarkerMerger.mergeEntityFieldsContainers(realm.markersContainer, marker.fields)
						}
						didChildUpdate = true
						break
					}
					default:
						assertNever(fieldState)
				}
				if (didChildUpdate) {
					if (state.childrenWithPendingUpdates === undefined) {
						state.childrenWithPendingUpdates = new Set()
					}
					if (fieldState.type !== StateType.EntityStub) {
						fieldState.hasPendingUpdate = true
						fieldState.hasStaleAccessor = true
						state.childrenWithPendingUpdates.add(fieldState)
					}
					didUpdate = true
				}
			}
		}

		if (didUpdate) {
			state.hasStaleAccessor = true
			state.hasPendingUpdate = true
		}
		return didUpdate
	}

	private updateEntityListPersistedData(
		alreadyProcessed: AlreadyProcessed,
		state: EntityListState,
		completeMarkersContainer: EntityFieldMarkersContainer | undefined,
		newMarkersContainer: EntityFieldMarkersContainer,
		newPersistedData: Set<string>,
	): boolean {
		let didUpdate = false
		const unaccountedForChildren = new Map(state.children)

		let haveSameKeySets = state.children.size === newPersistedData.size

		if (haveSameKeySets) {
			const newKeyIterator = newPersistedData[Symbol.iterator]()
			for (const [oldKey] of state.children) {
				if (!newPersistedData.has(oldKey)) {
					haveSameKeySets = false
					break
				}
				// We also check the order
				const newKeyResult = newKeyIterator.next()
				if (!newKeyResult.done && newKeyResult.value !== oldKey) {
					haveSameKeySets = false
					break
				}
			}
		}
		if (!haveSameKeySets) {
			didUpdate = true
		}

		const initialData: Set<string | undefined> =
			newPersistedData.size > 0
				? newPersistedData
				: new Set(Array.from({ length: state.creationParameters.initialEntityCount }))

		const mergedContainer = completeMarkersContainer
			? MarkerMerger.mergeEntityFieldsContainers(completeMarkersContainer, newMarkersContainer)
			: newMarkersContainer
		// TODO also update other init params.
		state.markersContainer = mergedContainer
		state.persistedEntityIds = newPersistedData

		state.children.clear() // Preserving the reference!

		// TODO instead of calling initializeEntityState we might be able to perform some Longest Common Subsequence
		// 	wizardry and match the id sets in order to convert the unpersisted
		for (const newPersistedId of initialData) {
			if (newPersistedId === undefined) {
				// This already ads the stub to the children map.
				this.stateInitializer.initializeListEntityStub(state, newPersistedId)
				didUpdate = true
			} else {
				let didChildUpdate = false
				let childState = unaccountedForChildren.get(newPersistedId)

				if (childState === undefined) {
					// It wasn't connected before but that doesn't mean that it hasn't been loaded so we check the entity store.
					childState = this.treeStore.entityStore.get(newPersistedId)

					if (childState === undefined) {
						// This already adds it to the children set so we're technically overwriting it but it doesn't matter.
						childState = this.stateInitializer.initializeListEntityStub(state, newPersistedId)
					} else if (childState.type === StateType.Entity) {
						didChildUpdate = this.updateSingleEntityPersistedData(
							alreadyProcessed,
							state,
							newPersistedId,
							childState,
							completeMarkersContainer,
							newMarkersContainer,
							new ServerGeneratedUuid(newPersistedId),
						)
					} else {
						assertNever(childState)
					}
				} else if (childState.type === StateType.Entity) {
					didChildUpdate = this.updateSingleEntityPersistedData(
						alreadyProcessed,
						state,
						newPersistedId,
						childState,
						completeMarkersContainer,
						newMarkersContainer,
						new ServerGeneratedUuid(newPersistedId),
					)
				} else if (childState.type === StateType.EntityStub) {
					const realmsByKey = childState.realms.get(state)
					assert(realmsByKey !== undefined)
					const realm = realmsByKey.get(newPersistedId)
					assert(realm !== undefined)
					realm.markersContainer = mergedContainer
					didChildUpdate = true
				}

				unaccountedForChildren.delete(newPersistedId)
				state.children.set(newPersistedId, childState)
				if (didChildUpdate) {
					didUpdate = true
					if (state.childrenWithPendingUpdates === undefined) {
						state.childrenWithPendingUpdates = new Set()
					}
					if (childState.type === StateType.Entity) {
						state.childrenWithPendingUpdates.add(childState)
					}
				}
			}
		}

		if (unaccountedForChildren.size) {
			didUpdate = true
			// TODO this should be WAY MORE thorough.
			for (const [key, child] of unaccountedForChildren) {
				state.plannedRemovals?.delete(child)

				if (child.type === StateType.Entity) {
					state.childrenWithPendingUpdates?.delete(child)
				}

				child.realms.delete(state)
				if (!child.realms.size) {
					state.children.delete(key)
				}
			}
		}

		if (didUpdate) {
			state.hasStaleAccessor = true
			state.hasPendingUpdate = true
		}
		return didUpdate
	}
}
