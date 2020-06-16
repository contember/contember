import { EntityAccessor, EntityListAccessor } from '../../accessors'
import { ReceivedEntityData } from '../../accessorTree'
import { EntityFieldMarkers, ReferenceMarker } from '../../markers'
import { RemovalType } from '../../treeParameters/primitives'
import { ErrorsPreprocessor } from '../ErrorsPreprocessor'
import { InternalContainerState } from './InternalContainerState'
import { InternalEntityState, OnEntityUpdate } from './InternalEntityState'
import { InternalStateType } from './InternalStateType'

export interface InternalEntityPlannedRemoval {
	removalType: RemovalType
	removedEntity: InternalEntityState
}

export type OnEntityListUpdate = (state: InternalEntityListState) => void
export interface InternalEntityListState extends InternalContainerState {
	type: InternalStateType.EntityList
	accessor: EntityListAccessor
	addEventListener: EntityListAccessor.AddEntityListEventListener
	childrenKeys: Set<string>
	childrenWithPendingUpdates: Set<InternalEntityState> | undefined
	//childrenWithUnpersistedChanges: Set<InternalEntityState> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityListAccessor.EntityListEventType]:
			| Set<EntityListAccessor.EntityListEventListenerMap[Type]>
			| undefined
	}
	fieldMarkers: EntityFieldMarkers
	initialData: ReceivedEntityData<undefined | null>[] | EntityAccessor[]
	plannedRemovals: Set<InternalEntityPlannedRemoval> | undefined

	onChildEntityUpdate: OnEntityUpdate // To be called by the child entity to inform this entity list
	onEntityListUpdate: OnEntityListUpdate // To be called by this entity list to inform the parent entity

	getEntityByKey: EntityListAccessor.GetEntityByKey
	preferences: ReferenceMarker.ReferencePreferences
	batchUpdates: EntityListAccessor.BatchUpdates
	connectEntity: EntityListAccessor.ConnectEntity
	createNewEntity: EntityListAccessor.CreateNewEntity
	disconnectEntity: EntityListAccessor.DisconnectEntity
}
