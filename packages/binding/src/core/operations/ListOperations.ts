import { BindingOperations, EntityAccessor, EntityListAccessor } from '../../accessors'
import { UnpersistedEntityDummyId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { EventManager } from '../EventManager'
import { ErrorLocator, LocalizedBindingError } from '../exceptions'
import { MarkerComparator } from '../MarkerComparator'
import { EntityListState, StateIterator, StateType } from '../state'
import { StateInitializer } from '../StateInitializer'
import { TreeStore } from '../TreeStore'
import { EntityOperations } from './EntityOperations'
import { OperationsHelpers } from './OperationsHelpers'

export class ListOperations {
	public constructor(
		private readonly bindingOperations: BindingOperations,
		private readonly entityOperations: EntityOperations,
		private readonly eventManager: EventManager,
		private readonly stateInitializer: StateInitializer,
		private readonly treeStore: TreeStore,
	) {}

	public batchUpdates(state: EntityListState, performUpdates: EntityListAccessor.BatchUpdatesHandler) {
		this.eventManager.syncOperation(() => {
			performUpdates(state.getAccessor, this.bindingOperations)
		})
	}

	public connectEntity(outerState: EntityListState, entityToConnect: EntityAccessor) {
		this.eventManager.syncOperation(() => {
			const stateToConnect = OperationsHelpers.resolveAndPrepareEntityToConnect(this.treeStore, entityToConnect)
			const idToConnect = stateToConnect.entity.id

			for (const state of StateIterator.eachSiblingRealmChild(outerState)) {
				if (state.children.has(idToConnect.value)) {
					return
				}

				try {
					MarkerComparator.assertEntityMarkersSubsetOf(
						state.blueprint.marker.fields,
						stateToConnect.blueprint.markersContainer,
					)
				} catch (error) {
					if (error instanceof LocalizedBindingError) {
						throw new BindingError(
							`Entity list: cannot connect entity with key '${entityToConnect.key}' because its fields ` +
								` are incompatible with entities found on this list. Make sure both trees are equivalent.\n\n` +
								`${error.message}\n\n` +
								(error.markerPath.length > 1
									? `Incompatibility found at: ${ErrorLocator.locateMarkerPath(error.markerPath)}.\n\n`
									: '') +
								`Entity list located at: ${ErrorLocator.locateInternalState(state)}.`,
						)
					}
					throw error
				}
				this.stateInitializer.initializeListEntity(state, idToConnect)

				state.plannedRemovals?.delete(stateToConnect)

				let changesDelta = 0

				if (state.persistedEntityIds.has(idToConnect.value)) {
					// It was removed from the list but now we're adding it back.
					changesDelta = -1
				} else {
					changesDelta = 1
				}
				if (stateToConnect.type === StateType.EntityRealm) {
					changesDelta += stateToConnect.unpersistedChangesCount
				}

				this.eventManager.registerJustUpdated(state, changesDelta)
			}
		})
	}

	public disconnectEntity(listState: EntityListState, childEntity: EntityAccessor) {
		this.eventManager.syncOperation(() => {
			for (const state of StateIterator.eachSiblingRealmChild(listState)) {
				const disconnectedChildIdValue = childEntity.id
				const disconnectedChildRealm = state.children.get(disconnectedChildIdValue)

				if (disconnectedChildRealm === undefined) {
					throw new BindingError(
						`Entity list doesn't include an entity with id '${disconnectedChildIdValue}' and so it cannot remove it.`,
					)
				}

				const disconnectedRealmKey = disconnectedChildRealm.realmKey
				disconnectedChildRealm.entity.realms.delete(disconnectedRealmKey)
				listState.children.delete(disconnectedChildIdValue)

				// TODO handle zero realms after the delete

				let changesDelta = 0

				if (state.persistedEntityIds.has(disconnectedChildIdValue)) {
					changesDelta++

					if (state.plannedRemovals === undefined) {
						state.plannedRemovals = new Map()
					}
					state.plannedRemovals.set(disconnectedChildRealm, 'disconnect')
				} else {
					// It wasn't on the list, then it was, and now we're removing it again.
					changesDelta--
				}

				if (disconnectedChildRealm.type === StateType.EntityRealm) {
					// Undoing whatever changes this child had caused.
					changesDelta -= disconnectedChildRealm.unpersistedChangesCount
				}

				this.eventManager.registerJustUpdated(state, changesDelta)
			}
		})
	}

	public createNewEntity(outerState: EntityListState, initialize: EntityAccessor.BatchUpdatesHandler | undefined) {
		this.eventManager.syncOperation(() => {
			// All siblings need to have the same id.
			const id = new UnpersistedEntityDummyId()

			for (const state of StateIterator.eachSiblingRealmChild(outerState)) {
				const newEntity = this.stateInitializer.initializeListEntity(state, id)

				OperationsHelpers.runImmediateUserInitialization(this.stateInitializer, newEntity, initialize)

				// The act of creating the entity doesn't constitute a change unless there's something inside to persist.
				// TODO forceCreate
				// TODO defaultValue
				this.eventManager.registerJustUpdated(state, EventManager.NO_CHANGES_DIFFERENCE)
			}
		})
	}

	public getChildEntityById(state: EntityListState, id: string) {
		const realm = state.children.get(id)
		if (realm === undefined) {
			throw new BindingError(`EntityList: cannot retrieve an entity with id '${id}' as it is not on the list.`)
		}
		return realm.getAccessor()
	}
}
