import { validate as uuidValidate } from 'uuid'
import type { BatchUpdatesOptions, EntityAccessor, EntityListAccessor, ErrorAccessor } from '../../accessors'
import { RuntimeId, UnpersistedEntityDummyId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import type { AccessorErrorManager } from '../AccessorErrorManager'
import { EventManager } from '../EventManager'
import { ErrorLocator, LocalizedBindingError } from '../exceptions'
import { MarkerComparator } from '../MarkerComparator'
import { RealmKeyGenerator } from '../RealmKeyGenerator'
import { EntityListState, getEntityMarker, StateIterator } from '../state'
import type { StateInitializer } from '../StateInitializer'
import type { TreeStore } from '../TreeStore'
import { OperationsHelpers } from './OperationsHelpers'
import { EntityId, EventListenersStore } from '../../treeParameters'

export class ListOperations {
	public constructor(
		private readonly accessorErrorManager: AccessorErrorManager,
		private readonly batchUpdatesOptions: BatchUpdatesOptions,
		private readonly eventManager: EventManager,
		private readonly stateInitializer: StateInitializer,
		private readonly treeStore: TreeStore,
	) {}

	public addError(listState: EntityListState, error: ErrorAccessor.Error): () => void {
		return this.accessorErrorManager.addError(listState, error)
	}

	public addEventListener<Type extends keyof EntityListAccessor.RuntimeEntityListEventListenerMap>(
		state: EntityListState,
		event: { type: Type; key?: string },
		listener: EntityListAccessor.RuntimeEntityListEventListenerMap[Type],
	) {
		if (state.eventListeners === undefined) {
			state.eventListeners = new EventListenersStore()
		}
		return state.eventListeners.add(event, listener)
	}

	public addChildEventListener<Type extends keyof EntityAccessor.EntityEventListenerMap>(
		state: EntityListState,
		event: { type: Type; key?: string },
		listener: EntityAccessor.EntityEventListenerMap[Type],
	) {
		if (state.childEventListeners === undefined) {
			state.childEventListeners = new EventListenersStore()
		}
		return state.childEventListeners.add(event, listener)
	}

	public batchUpdates(state: EntityListState, performUpdates: EntityListAccessor.BatchUpdatesHandler) {
		this.eventManager.syncOperation(() => {
			performUpdates(state.getAccessor, this.batchUpdatesOptions)
		})
	}

	public connectEntity(outerState: EntityListState, entityToConnect: EntityAccessor) {
		this.eventManager.syncOperation(() => {
			const persistedEntityIds = this.treeStore.getEntityListPersistedIds(outerState)
			const stateToConnect = OperationsHelpers.resolveAndPrepareEntityToConnect(this.treeStore, entityToConnect)
			const idToConnect = stateToConnect.entity.id

			// TODO disable this at the top-level.
			for (const state of StateIterator.eachSiblingRealmChild(this.treeStore, outerState)) {
				if (state.entityName !== stateToConnect.entity.entityName) {
					throw new BindingError(
						`EntityListAccessor.connectEntity: Attempting to connect at an entity of type ` +
							`'${stateToConnect.entity.entityName}' but '${state.entityName}' is expected.\n\n` +
							`Entity located at: ${ErrorLocator.locateInternalState(outerState)}.`,
					)
				}

				try {
					MarkerComparator.assertEntityMarkersSubsetOf(
						state.blueprint.marker.fields,
						getEntityMarker(stateToConnect).fields,
					)
				} catch (error) {
					if (error instanceof LocalizedBindingError) {
						throw new BindingError(
							`Entity list: cannot connect entity with key '${entityToConnect.key}' because its fields are ` +
								`incompatible with entities found on this list. Make sure both trees are equivalent.\n\n` +
								`${error.message}\n\n` +
								(error.markerPath.length > 1
									? `Incompatibility found at: ${ErrorLocator.locateMarkerPath(error.markerPath)}.\n\n`
									: '') +
								`Entity list located at: ${ErrorLocator.locateInternalState(state)}.`,
						)
					}
					throw error
				}

				if (state.children.has(idToConnect.value)) {
					continue
				}

				this.stateInitializer.initializeEntityRealm(idToConnect, state.entityName, {
					type: 'listEntity',
					parent: state,
				}, stateToConnect)

				state.plannedRemovals?.delete(idToConnect.value)

				let changesDelta = 0

				if (persistedEntityIds.has(idToConnect.value)) {
					// It was removed from the list but now we're adding it back.
					changesDelta--
				} else if (idToConnect.existsOnServer) {
					// ignoring unpersisted entities
					changesDelta++
				}
				if (stateToConnect.type === 'entityRealm') {
					changesDelta += stateToConnect.unpersistedChangesCount
				}

				this.eventManager.registerJustUpdated(state, changesDelta)
			}
		})
	}

	public disconnectEntity(listState: EntityListState, childEntity: EntityAccessor, options: {noPersist?: boolean}) {
		this.eventManager.syncOperation(() => {
			// TODO disable this at the top-level.
			const persistedEntityIds = this.treeStore.getEntityListPersistedIds(listState)
			for (const state of StateIterator.eachSiblingRealmChild(this.treeStore, listState)) {
				const disconnectedChildIdValue = childEntity.id
				const disconnectedChildRealm = state.children.get(disconnectedChildIdValue)

				if (disconnectedChildRealm === undefined) {
					throw new BindingError(
						`Entity list doesn't include an entity with id '${disconnectedChildIdValue}' and so it cannot remove it.`,
					)
				}

				this.treeStore.disposeOfRealm(disconnectedChildRealm)
				state.children.delete(disconnectedChildIdValue)

				let changesDelta = 0

				if (persistedEntityIds.has(disconnectedChildIdValue)) {
					changesDelta++

					if (state.plannedRemovals === undefined) {
						state.plannedRemovals = new Map()
					}
					if (!options.noPersist) {
						state.plannedRemovals.set(disconnectedChildIdValue, 'disconnect')
					}
				} else if (disconnectedChildRealm.entity.id.existsOnServer) {
					// Disconnecting unpersisted entities doesn't constitute a change.

					// It wasn't on the list, then it was, and now we're removing it again.
					changesDelta--
				}

				if (disconnectedChildRealm.type === 'entityRealm') {
					// Undoing whatever changes this child had caused.
					changesDelta -= disconnectedChildRealm.unpersistedChangesCount
				}

				this.eventManager.registerJustUpdated(state, changesDelta)
			}
		})
	}

	public createNewEntity(outerState: EntityListState, initialize: EntityAccessor.BatchUpdatesHandler | undefined): RuntimeId {
		return this.eventManager.syncOperation((): RuntimeId => {
			// All siblings need to have the same id.
			const id = new UnpersistedEntityDummyId()

			for (const state of StateIterator.eachSiblingRealmChild(this.treeStore, outerState)) {
				const newEntity = this.stateInitializer.initializeEntityRealm(id, state.entityName, {
					type: 'listEntity',
					parent: state,
				})

				this.stateInitializer.runImmediateUserInitialization(newEntity, initialize)

				// The act of creating the entity doesn't constitute a change unless there's something inside to persist.
				// TODO forceCreate
				// TODO defaultValue
				this.eventManager.registerJustUpdated(state, EventManager.NO_CHANGES_DIFFERENCE)
			}
			return id
		})
	}

	public getChildEntityById(state: EntityListState, id: EntityId) {
		const realm = state.children.get(id)
		if (realm === undefined) {
			const isRuntimeId = typeof id === 'number' || uuidValidate(id) || UnpersistedEntityDummyId.matchesDummyId(id)
			if (isRuntimeId) {
				throw new BindingError(`EntityList: cannot retrieve an entity with id '${id}' as it is not on the list.`)
			}
			const looksLikeKey = typeof id === 'string' && (this.treeStore.entityRealmStore.has(id) || RealmKeyGenerator.vaguelyAppearsToBeAKey(id))
			throw new BindingError(
				`EntityList: cannot retrieve an entity with id '${id}' because it's not a valid id.` +
					(looksLikeKey
						? `\nThe supplied value appears to be an entity *key*, not an *id*. List accessors are indexed by ids ` +
						  `and you can use \`EntityAccessor.id\` to obtain one. Keys, on the other hand, are globally unique and ` +
						  `you can use \`getEntityByKey\` to get its EntityAccessor.`
						: ''),
			)
		}
		return realm.getAccessor()
	}
}
