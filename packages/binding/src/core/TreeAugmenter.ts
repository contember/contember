import { ReceivedDataTree, ServerGeneratedUuid, UnpersistedEntityDummyId } from '../accessorTree'
import {
	EntityFieldMarkersContainer,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
} from '../markers'
import { PlaceholderName, TreeRootId } from '../treeParameters'
import { assert, assertNever } from '../utils'
import { EventManager } from './EventManager'
import { MarkerMerger } from './MarkerMerger'
import { QueryResponseNormalizer } from './QueryResponseNormalizer'
import { EntityListState, EntityRealmKey, EntityRealmParent, EntityState, RootStateNode, StateType } from './state'
import { StateInitializer } from './StateInitializer'
import { TreeStore } from './TreeStore'

type AlreadyProcessed = Map<EntityRealmParent, Set<EntityRealmKey>>

export class TreeAugmenter {
	public constructor(
		private readonly eventManager: EventManager,
		private readonly stateInitializer: StateInitializer,
		private readonly treeStore: TreeStore,
	) {}

	public updatePersistedData(response: ReceivedDataTree) {
		//this.treeStore.updatePersistedData(response)
		//this.extendTree(this.treeStore.markerTree, response) // TODO!!!
	}

	public extendTree(
		newTreeId: TreeRootId | undefined,
		newMarkerTree: MarkerTreeRoot,
		newPersistedData: ReceivedDataTree,
	) {
		// TODO this doesn't yet handle updates for entities whose persisted data just gets magically changed without notice.
		QueryResponseNormalizer.mergeInResponse(this.treeStore.persistedData, newPersistedData)

		const subTreeStates: Map<PlaceholderName, RootStateNode> = new Map()

		this.treeStore.markerTrees.set(newTreeId, newMarkerTree)
		this.treeStore.subTreeStatesByRoot.set(newTreeId, subTreeStates)

		for (const [placeholderName, newSubTreeMarker] of newMarkerTree.subTrees) {
			const newState = this.stateInitializer.initializeSubTree(newSubTreeMarker)
			subTreeStates.set(placeholderName, newState)
		}
	}

	// TODO this whole process fails to:
	//		- Properly update realms
	//		- Update creationParameters
	//		- Update environment
	//		- Update initialEventListeners
	// private updateSingleEntityPersistedData(
	// 	alreadyProcessed: AlreadyProcessed,
	// 	parent: EntityRealmParent,
	// 	parentKey: EntityRealmKey,
	// 	state: EntityState,
	// 	completeMarkersContainer: EntityFieldMarkersContainer | undefined,
	// 	newMarkersContainer: EntityFieldMarkersContainer,
	// 	newId: ServerGeneratedUuid | UnpersistedEntityDummyId,
	// ): boolean {
	// 	const byParent = alreadyProcessed.get(parent)
	// 	if (byParent === undefined) {
	// 		alreadyProcessed.set(parent, new Set([parentKey]))
	// 	} else if (byParent.has(parentKey)) {
	// 		return false
	// 	} else {
	// 		byParent.add(parentKey)
	// 	}
	//
	// 	let didUpdate = false
	//
	// 	if (
	// 		newId.value !== state.id.value &&
	// 		!(newId instanceof UnpersistedEntityDummyId && state.id instanceof UnpersistedEntityDummyId)
	// 	) {
	// 		this.stateInitializer.changeEntityId(state, newId)
	// 		didUpdate = true
	// 	}
	//
	// 	const newPersistedData = this.treeStore.persistedEntityData.get(state.id.value)
	// 	state.persistedData = newPersistedData
	//
	// 	for (let [placeholderName, marker] of newMarkersContainer.markers) {
	// 		const completeMarker = completeMarkersContainer?.markers.get(placeholderName)
	// 		const newFieldDatum = newPersistedData?.get(placeholderName)
	// 		const fieldState = state.children.get(placeholderName)
	//
	// 		if (fieldState === undefined) {
	// 			this.stateInitializer.initializeEntityField(
	// 				state,
	// 				completeMarker ? MarkerMerger.mergeMarkers(completeMarker, marker) : marker,
	// 				newFieldDatum,
	// 			)
	// 			didUpdate = true
	// 		} else {
	// 			let didChildUpdate = false
	//
	// 			switch (fieldState.type) {
	// 				case StateType.Field: {
	// 					assert(marker instanceof FieldMarker)
	// 					assert(!(newFieldDatum instanceof Set) && !(newFieldDatum instanceof ServerGeneratedUuid))
	//
	// 					if (fieldState.persistedValue !== newFieldDatum) {
	// 						fieldState.persistedValue = newFieldDatum
	// 						fieldState.value = newFieldDatum ?? marker.defaultValue ?? null
	// 						fieldState.hasUnpersistedChanges = false
	//
	// 						didChildUpdate = true
	// 					}
	// 					break
	// 				}
	// 				case StateType.Entity: {
	// 					assert(marker instanceof HasOneRelationMarker)
	// 					assert(completeMarker === undefined || completeMarker instanceof HasOneRelationMarker)
	// 					assert(
	// 						newFieldDatum === null || newFieldDatum === undefined || newFieldDatum instanceof ServerGeneratedUuid,
	// 					)
	//
	// 					didChildUpdate = this.updateSingleEntityPersistedData(
	// 						alreadyProcessed,
	// 						state,
	// 						placeholderName,
	// 						fieldState,
	// 						completeMarker?.fields,
	// 						marker.fields,
	// 						newFieldDatum || new UnpersistedEntityDummyId(),
	// 					)
	//
	// 					break
	// 				}
	// 				case StateType.EntityList: {
	// 					assert(marker instanceof HasManyRelationMarker)
	// 					assert(completeMarker === undefined || completeMarker instanceof HasManyRelationMarker)
	// 					assert(newFieldDatum instanceof Set || newFieldDatum === undefined)
	// 					didChildUpdate = this.updateEntityListPersistedData(
	// 						alreadyProcessed,
	// 						fieldState,
	// 						completeMarker?.fields,
	// 						marker.fields,
	// 						newFieldDatum || new Set(),
	// 					)
	// 					break
	// 				}
	// 				case StateType.EntityStub: {
	// 					assert(marker instanceof HasOneRelationMarker)
	//
	// 					const realmsByKey = fieldState.realms.get(state)
	// 					assert(realmsByKey !== undefined)
	// 					const realm = realmsByKey.get(parentKey)
	// 					if (realm === undefined) {
	// 						realmsByKey.set(parentKey, {
	// 							parent: state,
	// 							realmKey: parentKey,
	// 							markersContainer: marker.fields,
	// 							initialEventListeners: marker.relation,
	// 							environment: marker.environment,
	// 							creationParameters: marker.relation,
	// 						})
	// 					} else {
	// 						realm.markersContainer = MarkerMerger.mergeEntityFieldsContainers(realm.markersContainer, marker.fields)
	// 					}
	// 					didChildUpdate = true
	// 					break
	// 				}
	// 				default:
	// 					assertNever(fieldState)
	// 			}
	// 			if (didChildUpdate) {
	// 				if (state.childrenWithPendingUpdates === undefined) {
	// 					state.childrenWithPendingUpdates = new Set()
	// 				}
	// 				if (fieldState.type !== StateType.EntityStub) {
	// 					fieldState.hasPendingUpdate = true
	// 					fieldState.hasStaleAccessor = true
	// 					state.childrenWithPendingUpdates.add(fieldState)
	// 				}
	// 				didUpdate = true
	// 			}
	// 		}
	// 	}
	//
	// 	if (didUpdate) {
	// 		//
	// 	}
	// 	return didUpdate
	// }
	//
	// private updateEntityListPersistedData(
	// 	alreadyProcessed: AlreadyProcessed,
	// 	state: EntityListState,
	// 	completeMarkersContainer: EntityFieldMarkersContainer | undefined,
	// 	newMarkersContainer: EntityFieldMarkersContainer,
	// 	newPersistedData: Set<string>,
	// ): boolean {
	// 	let didUpdate = false
	// 	const unaccountedForChildren = new Map(state.children)
	//
	// 	let haveSameKeySets = state.children.size === newPersistedData.size
	//
	// 	if (haveSameKeySets) {
	// 		const newKeyIterator = newPersistedData[Symbol.iterator]()
	// 		for (const [oldKey] of state.children) {
	// 			if (!newPersistedData.has(oldKey)) {
	// 				haveSameKeySets = false
	// 				break
	// 			}
	// 			// We also check the order
	// 			const newKeyResult = newKeyIterator.next()
	// 			if (!newKeyResult.done && newKeyResult.value !== oldKey) {
	// 				haveSameKeySets = false
	// 				break
	// 			}
	// 		}
	// 	}
	// 	if (!haveSameKeySets) {
	// 		didUpdate = true
	// 	}
	//
	// 	const initialData: Set<string | undefined> =
	// 		newPersistedData.size > 0
	// 			? newPersistedData
	// 			: new Set(Array.from({ length: state.creationParameters.initialEntityCount }))
	//
	// 	const mergedContainer = completeMarkersContainer
	// 		? MarkerMerger.mergeEntityFieldsContainers(completeMarkersContainer, newMarkersContainer)
	// 		: newMarkersContainer
	// 	// TODO also update other init params.
	// 	state.markersContainer = mergedContainer
	// 	state.persistedEntityIds = newPersistedData
	//
	// 	state.children.clear() // Preserving the reference!
	//
	// 	// TODO instead of calling initializeEntityState we might be able to perform some Longest Common Subsequence
	// 	// 	wizardry and match the id sets in order to convert the unpersisted
	// 	for (const newPersistedId of initialData) {
	// 		if (newPersistedId === undefined) {
	// 			// This already ads the stub to the children map.
	// 			this.stateInitializer.initializeListEntityStub(state, newPersistedId)
	// 			didUpdate = true
	// 		} else {
	// 			let didChildUpdate = false
	// 			let childState = unaccountedForChildren.get(newPersistedId)
	//
	// 			if (childState === undefined) {
	// 				// It wasn't connected before but that doesn't mean that it hasn't been loaded so we check the entity store.
	// 				childState = this.treeStore.entityStore.get(newPersistedId)
	//
	// 				if (childState === undefined) {
	// 					// This already adds it to the children set so we're technically overwriting it but it doesn't matter.
	// 					childState = this.stateInitializer.initializeListEntityStub(state, newPersistedId)
	// 				} else if (childState.type === StateType.Entity) {
	// 					didChildUpdate = this.updateSingleEntityPersistedData(
	// 						alreadyProcessed,
	// 						state,
	// 						newPersistedId,
	// 						childState,
	// 						completeMarkersContainer,
	// 						newMarkersContainer,
	// 						new ServerGeneratedUuid(newPersistedId),
	// 					)
	// 				} else {
	// 					assertNever(childState)
	// 				}
	// 			} else if (childState.type === StateType.Entity) {
	// 				didChildUpdate = this.updateSingleEntityPersistedData(
	// 					alreadyProcessed,
	// 					state,
	// 					newPersistedId,
	// 					childState,
	// 					completeMarkersContainer,
	// 					newMarkersContainer,
	// 					new ServerGeneratedUuid(newPersistedId),
	// 				)
	// 			} else if (childState.type === StateType.EntityStub) {
	// 				const realmsByKey = childState.realms.get(state)
	// 				assert(realmsByKey !== undefined)
	// 				const realm = realmsByKey.get(newPersistedId)
	// 				assert(realm !== undefined)
	// 				realm.markersContainer = mergedContainer
	// 				didChildUpdate = true
	// 			}
	//
	// 			unaccountedForChildren.delete(newPersistedId)
	// 			state.children.set(newPersistedId, childState)
	// 			if (didChildUpdate) {
	// 				didUpdate = true
	// 				if (state.childrenWithPendingUpdates === undefined) {
	// 					state.childrenWithPendingUpdates = new Set()
	// 				}
	// 				if (childState.type === StateType.Entity) {
	// 					state.childrenWithPendingUpdates.add(childState)
	// 				}
	// 			}
	// 		}
	// 	}
	//
	// 	if (unaccountedForChildren.size) {
	// 		didUpdate = true
	// 		// TODO this should be WAY MORE thorough.
	// 		for (const [key, child] of unaccountedForChildren) {
	// 			state.plannedRemovals?.delete(child)
	//
	// 			if (child.type === StateType.Entity) {
	// 				state.childrenWithPendingUpdates?.delete(child)
	// 			}
	//
	// 			child.realms.delete(state)
	// 			if (!child.realms.size) {
	// 				state.children.delete(key)
	// 			}
	// 		}
	// 	}
	//
	// 	if (didUpdate) {
	// 		state.hasStaleAccessor = true
	// 		state.hasPendingUpdate = true
	// 	}
	// 	return didUpdate
	// }
}
