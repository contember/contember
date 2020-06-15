import { EntityAccessor, EntityForRemovalAccessor, EntityListAccessor } from '../../accessors'
import { ReceivedEntityData } from '../../accessorTree'
import { EntityFieldMarkers, ReferenceMarker } from '../../markers'
import { RemovalType } from '../../treeParameters/primitives'
import { ErrorsPreprocessor } from '../ErrorsPreprocessor'
import { InternalContainerState } from './InternalContainerState'
import { InternalEntityState } from './InternalEntityState'
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
	initialData: ReceivedEntityData<undefined | null>[] | Array<EntityAccessor | EntityForRemovalAccessor>
	plannedRemovals: Set<InternalEntityPlannedRemoval> | undefined

	onUpdate: OnEntityListUpdate
	getEntityByKey: EntityListAccessor.GetEntityByKey
	preferences: ReferenceMarker.ReferencePreferences
	batchUpdates: EntityListAccessor.BatchUpdates
	connectEntity: EntityListAccessor.ConnectEntity
	createNewEntity: EntityListAccessor.CreateNewEntity
	disconnectEntity: EntityListAccessor.DisconnectEntity
}
