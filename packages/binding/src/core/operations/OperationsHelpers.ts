import { EntityAccessor } from '../../accessors'
import { RuntimeId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { EventManager } from '../EventManager'
import { RealmKeyGenerator } from '../RealmKeyGenerator'
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
		entityToConnect: EntityAccessor,
	): EntityRealmState | EntityRealmStateStub {
		const entityToConnectKey = entityToConnect.key
		const stateToConnect = treeStore.entityRealmStore.get(entityToConnectKey)

		if (stateToConnect === undefined) {
			throw new BindingError(`Attempting to connect an entity with key '${entityToConnectKey}' but it doesn't exist.`)
		}
		// TODO This is commented out for now in order to at least somewhat mitigate the limitations of dealing with
		//		inverse relations. However, once that has been addressed systemically, this code needs to be re-enabled.
		// if (!stateToConnect.entity.id.existsOnServer) {
		// 	throw new BindingError(
		// 		`Attempting to connect an entity with key '${stateToConnect.realmKey}' that ` +
		// 			`doesn't exist on server. That is currently impossible.`, // At least for now.
		// 	)
		// }

		// TODO
		// if (stateToConnect.entity.isScheduledForDeletion) {
		// 	// As far as the other realms are concerned, this entity is deleted. We don't want to just make it re-appear
		// 	// for them just because some other random relation decided to connect it.
		// 	stateToConnect.entity.realms.clear()
		// 	stateToConnect.entity.isScheduledForDeletion = false
		// }

		return stateToConnect
	}

	public static runImmediateUserInitialization(
		stateInitializer: StateInitializer,
		realm: EntityRealmState | EntityRealmStateStub,
		initialize: EntityAccessor.BatchUpdatesHandler | undefined,
	) {
		if (initialize === undefined) {
			return
		}
		const entityRealm = stateInitializer.materializeEntityRealm(realm)

		realm.getAccessor().batchUpdates(initialize)

		if (entityRealm.eventListeners.initialize === undefined || entityRealm.eventListeners.initialize.size === 0) {
			realm.entity.hasIdSetInStone = true
		}
	}

	public static changeEntityId(
		treeStore: TreeStore,
		eventManager: EventManager,
		entity: EntityState,
		newId: RuntimeId,
	) {
		const previousId = entity.id

		treeStore.entityStore.delete(previousId.value)
		treeStore.entityStore.set(newId.value, entity)
		entity.hasIdSetInStone = true
		entity.id = newId

		const existingRealms = new Map(entity.realms)
		entity.realms.clear()

		for (const [oldRealmKey, realm] of existingRealms) {
			const newRealmKey = RealmKeyGenerator.getRealmKey(newId, realm.blueprint)

			realm.realmKey = newRealmKey
			entity.realms.set(newRealmKey, realm)

			treeStore.entityRealmStore.delete(oldRealmKey)
			treeStore.entityRealmStore.set(newRealmKey, realm)

			if (realm.blueprint.type === 'listEntity') {
				realm.blueprint.parent.children.changeKey(previousId.value, newId.value) // 😎
			} else if (realm.blueprint.type === 'hasOne') {
				eventManager.registerUpdatedConnection(realm.blueprint.parent, realm.blueprint.marker.placeholderName)
			}
			if (realm.type === StateType.EntityRealm) {
				eventManager.registerJustUpdated(realm, EventManager.NO_CHANGES_DIFFERENCE)
			}
		}
	}
}
