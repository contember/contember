import { EntityAccessor } from '../../accessors'
import { BindingError } from '../../BindingError'
import { assertNever } from '../../utils'
import { EntityRealmState, EntityRealmStateStub, EntityState, StateType } from '../state'
import { StateInitializer } from '../StateInitializer'
import { TreeStore } from '../TreeStore'

export class OperationsHelpers {
	public static rejectInvalidAccessorTree(): never {
		throw new BindingError(
			`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
		)
	}

	public static resolveAndPrepareEntityToConnect(
		treeStore: TreeStore,
		entityToConnectOrItsKey: string | EntityAccessor,
	): [string, EntityState] {
		let entityToConnectKey: string

		if (typeof entityToConnectOrItsKey === 'string') {
			entityToConnectKey = entityToConnectOrItsKey
		} else {
			// TODO This is commented out for now in order to at least somewhat mitigate the limitations of dealing with
			//		inverse relations. However, once that has been addressed systemically, this code needs to be re-enabled.
			// if (!entityToConnectOrItsKey.existsOnServer) {
			// 	throw new BindingError(
			// 		`Attempting to connect an entity with key '${entityToConnectOrItsKey.key}' that ` +
			// 			`doesn't exist on server. That is currently impossible.`, // At least for now.
			// 	)
			// }
			entityToConnectKey = entityToConnectOrItsKey.key
		}

		const stateToConnect = treeStore.entityStore.get(entityToConnectKey)
		if (stateToConnect === undefined) {
			throw new BindingError(`Attempting to connect an entity with key '${entityToConnectKey}' but it doesn't exist.`)
		}
		if (stateToConnect.isScheduledForDeletion) {
			// As far as the other realms are concerned, this entity is deleted. We don't want to just make it re-appear
			// for them just because some other random relation decided to connect it.
			stateToConnect.realms.clear()
			stateToConnect.isScheduledForDeletion = false
		}

		return [entityToConnectKey, stateToConnect]
	}

	public static runImmediateUserInitialization(
		stateInitializer: StateInitializer,
		realmStub: EntityRealmStateStub,
		initialize: EntityAccessor.BatchUpdatesHandler | undefined,
	) {
		if (initialize === undefined) {
			return
		}
		const entityRealm = stateInitializer.initializeEntityRealm(realmStub)

		realmStub.getAccessor().batchUpdates(initialize)

		if (entityRealm.eventListeners.initialize === undefined || entityRealm.eventListeners.initialize.size === 0) {
			realmStub.entity.hasIdSetInStone = true
		}
	}
}
