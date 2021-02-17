import { EntityAccessor } from '../../accessors'
import { RuntimeId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { EntityId } from '../../treeParameters'
import { EventManager } from '../EventManager'
import { RealmKeyGenerator } from '../RealmKeyGenerator'
import { EntityListState, EntityRealmState, EntityRealmStateStub, EntityState, StateType } from '../state'
import { StateInitializer } from '../StateInitializer'
import { TreeStore } from '../TreeStore'

const emptyEntityIdSet: ReadonlySet<EntityId> = new Set()

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

	public static getEntityListPersistedIds(treeStore: TreeStore, state: EntityListState): ReadonlySet<string> {
		const blueprint = state.blueprint

		if (blueprint.parent) {
			const entityData = treeStore.persistedEntityData.get(blueprint.parent.entity.id.value)
			return (entityData?.get(blueprint.marker.placeholderName) as Set<string> | undefined) ?? emptyEntityIdSet
		} else {
			return (treeStore.subTreePersistedData.get(blueprint.marker.placeholderName) as Set<string>) ?? emptyEntityIdSet
		}
	}

	public static changeEntityId(
		treeStore: TreeStore,
		eventManager: EventManager,
		stateInitializer: StateInitializer,
		entity: EntityState,
		newId: RuntimeId,
	) {
		const previousId = entity.id

		treeStore.entityStore.delete(previousId.value)
		treeStore.entityStore.set(newId.value, entity)

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

		const newEntity = stateInitializer.initializeEntityState(newId, oldEntity.entityName)
		const newRealmKey = RealmKeyGenerator.getRealmKey(newId, realm.blueprint)

		realm.realmKey = newRealmKey
		realm.entity = newEntity

		// This may still actually be necessary if we're going from a client to server generated uuid.
		// They both may have the same value but still be different.
		newEntity.id = newId
		oldEntity.realms.delete(oldRealmKey)
		newEntity.realms.set(newRealmKey, realm)

		if (oldEntity.realms.size === 0) {
			treeStore.disposeOfEntity(oldEntity)
		}

		treeStore.entityRealmStore.delete(oldRealmKey)
		treeStore.entityRealmStore.set(newRealmKey, realm)

		if (realm.blueprint.type === 'listEntity') {
			const list = realm.blueprint.parent
			list.children.changeKey(oldId.value, newId.value) // 😎
		} else if (realm.blueprint.type === 'hasOne') {
			eventManager.registerUpdatedConnection(realm.blueprint.parent, realm.blueprint.marker.placeholderName)
		}
		const parent = realm.blueprint.parent
		if (parent) {
			eventManager.registerJustUpdated(parent, EventManager.NO_CHANGES_DIFFERENCE)
		}
		if (realm.type === StateType.EntityRealm) {
			eventManager.registerJustUpdated(realm, EventManager.NO_CHANGES_DIFFERENCE)
		}
	}
}
