import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import { EntityCreationParameters, PlaceholderName, SingleEntityEventListeners } from '../../treeParameters'
import { StateNode } from './StateNode'

export type OnEntityUpdate = (state: StateNode) => void

/*
 * Entity realms address the fact that a single particular entity may appear several times throughout the tree in
 * completely different contexts. Even with different fields.
 */
export interface EntityRealm {
	creationParameters: EntityCreationParameters
	environment: Environment
	initialEventListeners: SingleEntityEventListeners | undefined
	markersContainer: EntityFieldMarkersContainer
	placeholderName: PlaceholderName
	onUpdate: OnEntityUpdate
}
