import { EntityListAccessor, ErrorAccessor } from '../../accessors'
import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import {
	EntityCreationParameters,
	EntityListEventListeners,
	EntityListPreferences,
	PlaceholderName,
	RemovalType,
} from '../../treeParameters'
import { EntityRealmState, EntityRealmStateStub } from './EntityRealmState'
import { EntityState } from './EntityState'
import { StateType } from './StateType'

export interface EntityListBlueprint {
	creationParameters: EntityCreationParameters & EntityListPreferences
	environment: Environment
	initialEventListeners: EntityListEventListeners | undefined
	markersContainer: EntityFieldMarkersContainer
	parent: EntityRealmState | undefined // Undefined if we're at the top-level.
	placeholderName: PlaceholderName
}

export interface EntityListState {
	type: StateType.EntityList

	blueprint: EntityListBlueprint
	children: Map<string, EntityRealmState | EntityRealmStateStub>
	childrenWithPendingUpdates: Set<EntityRealmState> | undefined
	errors: ErrorAccessor | undefined
	eventListeners: {
		[Type in EntityListAccessor.EntityListEventType]:
			| Set<EntityListAccessor.EntityListEventListenerMap[Type]>
			| undefined
	}
	getAccessor: () => EntityListAccessor
	hasPendingParentNotification: boolean
	hasStaleAccessor: boolean
	persistedEntityIds: Set<string>
	plannedRemovals: Map<EntityRealmState | EntityRealmStateStub, RemovalType> | undefined
	unpersistedChangesCount: number

	addError: EntityListAccessor.AddError
	addEventListener: EntityListAccessor.AddEntityListEventListener
	batchUpdates: EntityListAccessor.BatchUpdates
	connectEntity: EntityListAccessor.ConnectEntity
	createNewEntity: EntityListAccessor.CreateNewEntity
	disconnectEntity: EntityListAccessor.DisconnectEntity
	getChildEntityById: EntityListAccessor.GetChildEntityById
}
