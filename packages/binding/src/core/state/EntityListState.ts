import { EntityListAccessor, ErrorAccessor } from '../../accessors'
import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import { EntityCreationParameters, EntityListPreferences, RemovalType } from '../../treeParameters'
import { EntityState, OnEntityUpdate } from './EntityState'
import { EntityStateStub } from './EntityStateStub'
import { StateType } from './StateType'

export interface EntityListState {
	type: StateType.EntityList

	batchUpdateDepth: number
	children: Map<string, EntityState | EntityStateStub>
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
	onChildUpdate: OnEntityUpdate // To be called by the child entity to inform this entity list
	parent: EntityState | undefined // Undefined if we're at the top-level.
	persistedEntityIds: Set<string>
	plannedRemovals: Map<EntityState | EntityStateStub, RemovalType> | undefined

	addError: EntityListAccessor.AddError
	addEventListener: EntityListAccessor.AddEntityListEventListener
	batchUpdates: EntityListAccessor.BatchUpdates
	connectEntity: EntityListAccessor.ConnectEntity
	createNewEntity: EntityListAccessor.CreateNewEntity
	disconnectEntity: EntityListAccessor.DisconnectEntity
	getChildEntityByKey: EntityListAccessor.GetChildEntityByKey
}
