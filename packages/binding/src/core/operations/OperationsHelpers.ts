import type { EntityAccessor } from '../../accessors'
import type { RuntimeId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { PRIMARY_KEY_NAME } from '../../bindingTypes'
import { EventManager } from '../EventManager'
import { RealmKeyGenerator } from '../RealmKeyGenerator'
import type { EntityRealmState, EntityRealmStateStub, EntityState } from '../state'
import type { StateInitializer } from '../StateInitializer'
import type { TreeStore } from '../TreeStore'

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

	public static changeEntityId(
		treeStore: TreeStore,
		eventManager: EventManager,
		stateInitializer: StateInitializer,
		entity: EntityState,
		newId: RuntimeId,
	) {
		const previousId = entity.id

		treeStore.entityStore.delete(previousId.uniqueValue)
		treeStore.entityStore.set(newId.uniqueValue, entity)

		let counter = 0
		for (const realm of entity.realms.values()) {
			this.changeRealmId(treeStore, eventManager, stateInitializer, realm, newId)

			if (++counter === entity.realms.size) {
				break
			}
		}

		entity.hasIdSetInStone = true
		entity.id = newId
	}

	public static changeRealmId(
		treeStore: TreeStore,
		eventManager: EventManager,
		stateInitializer: StateInitializer,
		realm: EntityRealmState | EntityRealmStateStub,
		newId: RuntimeId,
	) {
		const oldEntity = realm.entity
		const oldRealmKey = realm.realmKey
		const oldId = oldEntity.id

		const realmBlueprint = realm.blueprint

		const newEntity = stateInitializer.initializeEntityState(newId, oldEntity.entityName)
		const newRealmKey = RealmKeyGenerator.getRealmKey(newId, realmBlueprint)

		realm.realmKey = newRealmKey
		realm.entity = newEntity

		// This may still actually be necessary if we're going from a client to server generated uuid.
		// They both may have the same value but still be different.
		newEntity.id = newId
		oldEntity.realms.delete(oldRealmKey)
		newEntity.realms.set(newRealmKey, realm)

		if (realm.type === 'entityRealm') {
			const childIdState = realm.children.get(PRIMARY_KEY_NAME)
			if (childIdState?.type === 'field') {
				childIdState.value = newId.value
				eventManager.registerJustUpdated(childIdState, EventManager.NO_CHANGES_DIFFERENCE)
			}

			this.purgeStaleListenersAfterIdChange(realm)
		}

		if (oldEntity.realms.size === 0) {
			treeStore.disposeOfEntity(oldEntity)
		}

		treeStore.entityRealmStore.delete(oldRealmKey)
		treeStore.entityRealmStore.set(newRealmKey, realm)

		if (realmBlueprint.type === 'listEntity') {
			const list = realmBlueprint.parent
			list.children.changeKey(oldId.value, newId.value) // 😎
		} else if (realmBlueprint.type === 'hasOne') {
			eventManager.registerUpdatedConnection(realmBlueprint.parent, realmBlueprint.marker.placeholderName)
		}
		const parent = realmBlueprint.parent
		if (parent) {
			eventManager.registerJustUpdated(parent, EventManager.NO_CHANGES_DIFFERENCE)
		}
		if (realm.type === 'entityRealm') {
			eventManager.registerJustUpdated(realm, EventManager.NO_CHANGES_DIFFERENCE)
		}
	}

	public static purgeStaleListenersAfterIdChange(realm: EntityRealmState) {
		// Version 1.
		// The listeners subscribed to a particular entity key so we no longer want to call these.
		// The only positionally associated listeners are in the blueprint so we re-initialize those.
		//realm.eventListeners = stateInitializer.initializeEntityEventListenerStore(realmBlueprint)

		// Version 2.
		// This is version two of this terrible hack. We want to preserve e.g. persistSuccess handlers.

		// Version 3.
		// The saga continues. We add a condition to exempt top-level realms. That way they can start
		// propagating changes from the top.
		const listeners = realm.eventListeners
		if (listeners) {
			if (realm.blueprint.parent) {
				listeners.delete({ type: 'update' })
			}
			listeners.deleteByType('connectionUpdate')
		}
	}
}
