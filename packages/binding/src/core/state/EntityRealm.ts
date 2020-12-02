import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import { EntityCreationParameters, SingleEntityEventListeners } from '../../treeParameters'
import { EntityRealmKey } from './EntityRealmKey'
import { EntityRealmParent } from './EntityRealmParent'

/*
 * Entity realms address the fact that a single particular entity may appear several times throughout the tree in
 * completely different contexts. Even with different fields.
 */
export interface EntityRealm {
	creationParameters: EntityCreationParameters
	environment: Environment
	initialEventListeners: SingleEntityEventListeners | undefined
	markersContainer: EntityFieldMarkersContainer
	parent: EntityRealmParent
	realmKey: EntityRealmKey
}
