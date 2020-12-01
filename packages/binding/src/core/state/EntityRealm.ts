import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import { EntityCreationParameters, SingleEntityEventListeners } from '../../treeParameters'

export interface EntityRealm {
	creationParameters: EntityCreationParameters
	environment: Environment
	initialEventListeners: SingleEntityEventListeners | undefined
	markersContainer: EntityFieldMarkersContainer
}
