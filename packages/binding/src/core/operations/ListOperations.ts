import { BindingOperations, EntityAccessor, EntityListAccessor } from '../../accessors'
import { UnpersistedEntityDummyId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { EventManager } from '../EventManager'
import { RealmKeyGenerator } from '../RealmKeyGenerator'
import { EntityListState, EntityState, StateNode, StateType } from '../state'
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

	// private batchUpdatesImplementation(state: EntityListState, performUpdates: EntityListAccessor.BatchUpdatesHandler) {
	// 	performUpdates(state.getAccessor, this.bindingOperations)
	//
	// 	if (
	// 		!state.hasPendingUpdate && // We must have already told the parent if this is true.
	// 		state.hasPendingParentNotification
	// 	) {
	// 		state.hasPendingUpdate = true
	// 		state.hasPendingParentNotification = false
	// 		this.eventManager.registerJustUpdated(state)
	// 	}
	// }

	public batchUpdates(state: EntityListState, performUpdates: EntityListAccessor.BatchUpdatesHandler) {
		this.eventManager.syncOperation(() => {
			performUpdates(state.getAccessor, this.bindingOperations)
		})
	}

	// public connectEntity(state: EntityListState, entityToConnectOrItsKey: EntityAccessor | string) {
	// 	this.eventManager.syncOperation(() => {
	// 		this.batchUpdatesImplementation(state, () => {
	// 			const [connectedEntityKey, connectedState] = OperationsHelpers.resolveAndPrepareEntityToConnect(
	// 				this.treeStore,
	// 				entityToConnectOrItsKey,
	// 			)
	//
	// 			if (state.children.has(connectedEntityKey)) {
	// 				return
	// 			}
	//
	// 			this.entityOperations.addEntityRealm(connectedState, {
	// 				markersContainer: state.markersContainer,
	// 				creationParameters: state.creationParameters,
	// 				environment: state.environment,
	// 				initialEventListeners: this.eventManager.getEventListenersForListEntity(state),
	// 				parent: state,
	// 				realmKey: connectedEntityKey,
	// 			})
	// 			state.children.set(connectedEntityKey, connectedState)
	// 			state.plannedRemovals?.delete(connectedState)
	//
	// 			if (state.persistedEntityIds.has(connectedEntityKey)) {
	// 				// It was removed from the list but now we're adding it back.
	// 				this.dirtinessTracker.decrement()
	// 			} else {
	// 				this.dirtinessTracker.increment()
	// 			}
	//
	// 			state.hasPendingParentNotification = true
	// 			state.hasStaleAccessor = true
	// 		})
	// 	})
	// }

	public createNewEntity(state: EntityListState, initialize: EntityAccessor.BatchUpdatesHandler | undefined) {
		this.eventManager.syncOperation(() => {
			const id = new UnpersistedEntityDummyId()
			// const newState = this.stateInitializer.initializeEntityRealm(
			// 	this.stateInitializer.initializeEntityRealmStub(id, this.stateInitializer.createListEntityBlueprint(state, id)),
			// )
			const newStub = this.stateInitializer.initializeEntityRealmStub(
				id,
				this.stateInitializer.createListEntityBlueprint(state, id),
			)

			state.hasStaleAccessor = true
			OperationsHelpers.runImmediateUserInitialization(this.stateInitializer, newStub, initialize)

			// The act of creating the entity doesn't constitute a change unless there's something inside to persist.
			// TODO forceCreate
			this.eventManager.registerJustUpdated(state, EventManager.NO_CHANGES_DIFFERENCE)
		})
	}

	// public disconnectEntity(state: EntityListState, childEntityOrItsKey: EntityAccessor | string) {
	// 	this.eventManager.syncOperation(() => {
	// 		this.batchUpdatesImplementation(state, () => {
	// 			const disconnectedChildKey =
	// 				typeof childEntityOrItsKey === 'string' ? childEntityOrItsKey : childEntityOrItsKey.key
	//
	// 			const disconnectedChildState = state.children.get(disconnectedChildKey)
	//
	// 			if (disconnectedChildState === undefined) {
	// 				throw new BindingError(
	// 					`Entity list doesn't include an entity with key '${disconnectedChildKey}' and so it cannot remove it.`,
	// 				)
	// 			}
	//
	// 			const didDelete = disconnectedChildState.realms.delete(state)
	// 			if (!didDelete) {
	// 				OperationsHelpers.rejectInvalidAccessorTree()
	// 			}
	// 			if (state.persistedEntityIds.has(disconnectedChildKey)) {
	// 				if (state.plannedRemovals === undefined) {
	// 					state.plannedRemovals = new Map()
	// 				}
	// 				state.plannedRemovals.set(disconnectedChildState, 'disconnect')
	// 			}
	//
	// 			if (state.persistedEntityIds.has(disconnectedChildKey)) {
	// 				this.dirtinessTracker.increment()
	// 			} else {
	// 				// It wasn't on the list, then it was, and now we're removing it again.
	// 				this.dirtinessTracker.decrement()
	// 			}
	//
	// 			state.children.delete(disconnectedChildKey)
	// 			state.hasPendingParentNotification = true
	// 			state.hasStaleAccessor = true
	// 		})
	// 	})
	// }

	// public onChildUpdate(state: EntityListState, updatedState: StateNode) {
	// 	if (updatedState.type !== StateType.Entity) {
	// 		throw new BindingError(`Illegal entity list value.`)
	// 	}
	//
	// 	// No beforeUpdate for child updates!
	// 	this.batchUpdatesImplementation(state, () => {
	// 		if (updatedState.isScheduledForDeletion) {
	// 			this.processEntityDeletion(state, updatedState)
	// 		} else {
	// 			this.eventManager.registerChildInNeedOfUpdate(state, updatedState)
	// 		}
	// 		state.hasPendingParentNotification = true
	// 		state.hasStaleAccessor = true
	// 	})
	// }

	public getChildEntityById(state: EntityListState, id: string) {
		const realmKey = RealmKeyGenerator.getListEntityRealmKey(id, state.blueprint)
		const realm = this.treeStore.entityRealmStore.get(realmKey)

		if (realm === undefined || realm.blueprint.parent !== state) {
			throw new BindingError(`EntityList: cannot retrieve an entity with id '${id}' as it is not on the list.`)
		}

		return realm.getAccessor()
	}
}
