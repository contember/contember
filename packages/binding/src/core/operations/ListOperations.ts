import { BindingOperations, EntityAccessor, EntityListAccessor } from '../../accessors'
import { UnpersistedEntityKey } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { DirtinessTracker } from '../DirtinessTracker'
import { EventManager } from '../EventManager'
import { EntityListState, EntityState, StateNode, StateType } from '../state'
import { StateInitializer } from '../StateInitializer'
import { TreeStore } from '../TreeStore'
import { EntityOperations } from './EntityOperations'
import { OperationsHelpers } from './OperationsHelpers'

export class ListOperations {
	public constructor(
		private readonly bindingOperations: BindingOperations,
		private readonly dirtinessTracker: DirtinessTracker,
		private readonly entityOperations: EntityOperations,
		private readonly eventManager: EventManager,
		private readonly stateInitializer: StateInitializer,
		private readonly treeStore: TreeStore,
	) {}

	private batchUpdatesImplementation(state: EntityListState, performUpdates: EntityListAccessor.BatchUpdatesHandler) {
		state.batchUpdateDepth++
		performUpdates(state.getAccessor, this.bindingOperations)
		state.batchUpdateDepth--

		if (
			state.batchUpdateDepth === 0 &&
			!state.hasPendingUpdate && // We must have already told the parent if this is true.
			state.hasPendingParentNotification
		) {
			state.hasPendingUpdate = true
			state.hasPendingParentNotification = false
			this.eventManager.registerJustUpdated(state)
			this.eventManager.notifyParents(state)
		}
	}

	public batchUpdates(state: EntityListState, performUpdates: EntityListAccessor.BatchUpdatesHandler) {
		this.eventManager.syncOperation(() => {
			this.batchUpdatesImplementation(state, performUpdates)
		})
	}

	public connectEntity(state: EntityListState, entityToConnectOrItsKey: EntityAccessor | string) {
		this.eventManager.syncOperation(() => {
			this.batchUpdatesImplementation(state, () => {
				const [connectedEntityKey, connectedState] = OperationsHelpers.resolveAndPrepareEntityToConnect(
					this.treeStore,
					entityToConnectOrItsKey,
				)

				if (state.children.has(connectedEntityKey)) {
					return
				}

				this.entityOperations.addEntityRealm(connectedState, {
					markersContainer: state.markersContainer,
					creationParameters: state.creationParameters,
					environment: state.environment,
					initialEventListeners: this.eventManager.getEventListenersForListEntity(state),
					parent: state,
					realmKey: connectedEntityKey,
				})
				state.children.set(connectedEntityKey, connectedState)
				state.plannedRemovals?.delete(connectedState)

				if (state.persistedEntityIds.has(connectedEntityKey)) {
					// It was removed from the list but now we're adding it back.
					this.dirtinessTracker.decrement()
				} else {
					this.dirtinessTracker.increment()
				}

				state.hasPendingParentNotification = true
				state.hasStaleAccessor = true
			})
		})
	}

	public createNewEntity(state: EntityListState, initialize: EntityAccessor.BatchUpdatesHandler | undefined) {
		this.eventManager.syncOperation(() => {
			this.batchUpdatesImplementation(state, () => {
				const id = new UnpersistedEntityKey()
				const newState = this.stateInitializer.initializeEntityState(
					id,
					this.stateInitializer.createListEntityRealm(state, id),
				)

				state.hasStaleAccessor = true
				state.hasPendingParentNotification = true
				state.children.set(id.value, newState)
				this.eventManager.registerChildInNeedOfUpdate(state, newState)

				OperationsHelpers.runImmediateUserInitialization(newState, initialize)
			})
		})
	}

	public disconnectEntity(state: EntityListState, childEntityOrItsKey: EntityAccessor | string) {
		this.eventManager.syncOperation(() => {
			this.batchUpdatesImplementation(state, () => {
				const disconnectedChildKey =
					typeof childEntityOrItsKey === 'string' ? childEntityOrItsKey : childEntityOrItsKey.key

				const disconnectedChildState = state.children.get(disconnectedChildKey)

				if (disconnectedChildState === undefined) {
					throw new BindingError(
						`Entity list doesn't include an entity with key '${disconnectedChildKey}' and so it cannot remove it.`,
					)
				}

				const didDelete = disconnectedChildState.realms.delete(state)
				if (!didDelete) {
					OperationsHelpers.rejectInvalidAccessorTree()
				}
				if (state.persistedEntityIds.has(disconnectedChildKey)) {
					if (state.plannedRemovals === undefined) {
						state.plannedRemovals = new Map()
					}
					state.plannedRemovals.set(disconnectedChildState, 'disconnect')
				}

				if (state.persistedEntityIds.has(disconnectedChildKey)) {
					this.dirtinessTracker.increment()
				} else {
					// It wasn't on the list, then it was, and now we're removing it again.
					this.dirtinessTracker.decrement()
				}

				state.children.delete(disconnectedChildKey)
				state.hasPendingParentNotification = true
				state.hasStaleAccessor = true
			})
		})
	}

	public onChildUpdate(state: EntityListState, updatedState: StateNode) {
		if (updatedState.type !== StateType.Entity) {
			throw new BindingError(`Illegal entity list value.`)
		}

		// No beforeUpdate for child updates!
		this.batchUpdatesImplementation(state, () => {
			if (updatedState.isScheduledForDeletion) {
				this.processEntityDeletion(state, updatedState)
			} else {
				this.eventManager.registerChildInNeedOfUpdate(state, updatedState)
			}
			state.hasPendingParentNotification = true
			state.hasStaleAccessor = true
		})
	}

	public getChildEntityByKey(state: EntityListState, key: string) {
		const childState = state.children.get(key)
		if (childState === undefined) {
			throw new BindingError(`EntityList: cannot retrieve an entity with key '${key}' as it is not on the list.`)
		}
		return childState.getAccessor()
	}

	private processEntityDeletion(state: EntityListState, stateForDeletion: EntityState) {
		// We don't remove entities from the store so as to allow their re-connection.
		state.childrenWithPendingUpdates?.delete(stateForDeletion)

		const key = stateForDeletion.id.value
		state.children.delete(key)
		state.hasPendingParentNotification = true

		if (!stateForDeletion.id.existsOnServer) {
			return
		}

		if (state.plannedRemovals === undefined) {
			state.plannedRemovals = new Map()
		}
		state.plannedRemovals.set(stateForDeletion, 'delete')
	}
}
