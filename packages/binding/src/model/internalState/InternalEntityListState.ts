import { EntityListAccessor } from '../../accessors'
import { EntityFieldMarkers, ReferenceMarker } from '../../markers'
import { RemovalType } from '../../treeParameters/primitives'
import { ErrorsPreprocessor } from '../ErrorsPreprocessor'
import { InternalEntityState, OnEntityUpdate } from './InternalEntityState'
import { InternalStateType } from './InternalStateType'

export interface InternalEntityPlannedRemoval {
	removalType: RemovalType
	removedEntity: InternalEntityState
}

export type OnEntityListUpdate = (state: InternalEntityListState) => void
export interface InternalEntityListState {
	type: InternalStateType.EntityList
	batchUpdateDepth: number
	childrenKeys: Set<string>
	childrenWithPendingUpdates: Set<InternalEntityState> | undefined
	childrenWithUnpersistedChanges: Set<InternalEntityState> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityListAccessor.EntityListEventType]:
			| Set<EntityListAccessor.EntityListEventListenerMap[Type]>
			| undefined
	}
	fieldMarkers: EntityFieldMarkers
	getAccessor: () => EntityListAccessor
	hasPendingParentNotification: boolean
	hasPendingUpdate: boolean
	hasStaleAccessor: boolean
	hasUnpersistedChanges: boolean
	persistedEntityIds: Set<string>
	plannedRemovals: Set<InternalEntityPlannedRemoval> | undefined

	onChildEntityUpdate: OnEntityUpdate // To be called by the child entity to inform this entity list
	onEntityListUpdate: OnEntityListUpdate // To be called by this entity list to inform the parent entity

	addEventListener: EntityListAccessor.AddEntityListEventListener
	batchUpdates: EntityListAccessor.BatchUpdates
	connectEntity: EntityListAccessor.ConnectEntity
	createNewEntity: EntityListAccessor.CreateNewEntity
	disconnectEntity: EntityListAccessor.DisconnectEntity
	getChildEntityByKey: EntityListAccessor.GetChildEntityByKey
	preferences: ReferenceMarker.ReferencePreferences
}
