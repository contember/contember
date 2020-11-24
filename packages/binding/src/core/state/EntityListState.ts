import { EntityListAccessor, ErrorAccessor } from '../../accessors'
import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import { EntityCreationParameters, EntityListPreferences, RemovalType } from '../../treeParameters'
import { EntityState, OnEntityUpdate } from './EntityState'
import { StateType } from './StateType'

export type OnEntityListUpdate = (state: EntityListState) => void
export interface EntityListState {
	type: StateType.EntityList
	batchUpdateDepth: number
	children: Set<EntityState>
	childrenWithPendingUpdates: Set<EntityState> | undefined
	creationParameters: EntityCreationParameters & EntityListPreferences
	environment: Environment
	errors: ErrorAccessor | undefined
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
	plannedRemovals: Map<EntityState, RemovalType> | undefined

	onChildEntityUpdate: OnEntityUpdate // To be called by the child entity to inform this entity list
	onEntityListUpdate: OnEntityListUpdate // To be called by this entity list to inform the parent entity

	addError: EntityListAccessor.AddError
	addEventListener: EntityListAccessor.AddEntityListEventListener
	batchUpdates: EntityListAccessor.BatchUpdates
	connectEntity: EntityListAccessor.ConnectEntity
	createNewEntity: EntityListAccessor.CreateNewEntity
	disconnectEntity: EntityListAccessor.DisconnectEntity
	getChildEntityByKey: EntityListAccessor.GetChildEntityByKey
}
