import { EntityListAccessor, ErrorAccessor } from '../../accessors'
import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import { EntityCreationParameters, EntityListPreferences, RemovalType } from '../../treeParameters'
import { InternalEntityState, OnEntityUpdate } from './InternalEntityState'
import { InternalStateType } from './InternalStateType'

export type OnEntityListUpdate = (state: InternalEntityListState) => void
export interface InternalEntityListState {
	type: InternalStateType.EntityList
	batchUpdateDepth: number
	children: Set<InternalEntityState>
	childrenWithPendingUpdates: Set<InternalEntityState> | undefined
	creationParameters: EntityCreationParameters & EntityListPreferences
	environment: Environment
	errors: ErrorAccessor[]
	eventListeners: {
		[Type in EntityListAccessor.EntityListEventType]:
			| Set<EntityListAccessor.EntityListEventListenerMap[Type]>
			| undefined
	}
	getAccessor: () => EntityListAccessor
	hasPendingParentNotification: boolean
	hasPendingUpdate: boolean
	hasStaleAccessor: boolean
	markersContainer: EntityFieldMarkersContainer
	persistedEntityIds: Set<string>
	plannedRemovals: Map<InternalEntityState, RemovalType> | undefined

	onChildEntityUpdate: OnEntityUpdate // To be called by the child entity to inform this entity list
	onEntityListUpdate: OnEntityListUpdate // To be called by this entity list to inform the parent entity

	addEventListener: EntityListAccessor.AddEntityListEventListener
	batchUpdates: EntityListAccessor.BatchUpdates
	connectEntity: EntityListAccessor.ConnectEntity
	createNewEntity: EntityListAccessor.CreateNewEntity
	disconnectEntity: EntityListAccessor.DisconnectEntity
	getChildEntityByKey: EntityListAccessor.GetChildEntityByKey
}
