import { EntityAccessor } from '../../accessors'
import { EntityFieldMarkers } from '../../markers'
import { FieldName, RemovalType } from '../../treeParameters/primitives'
import { AccessorTreeGenerator } from '../AccessorTreeGenerator'
import { ErrorsPreprocessor } from '../ErrorsPreprocessor'
import { InternalContainerState } from './InternalContainerState'
import { InternalStateNode } from './InternalStateNode'
import { InternalStateType } from './InternalStateType'

export interface InternalEntityFieldPlannedRemoval {
	field: FieldName
	removalType: RemovalType
	removedEntity: InternalEntityState
}

export type OnEntityFieldUpdate = (state: InternalStateNode) => void
export interface InternalEntityState extends InternalContainerState {
	type: InternalStateType.SingleEntity
	accessor: EntityAccessor
	addEventListener: EntityAccessor.AddEntityEventListener
	childrenWithPendingUpdates: Set<InternalStateNode> | undefined
	//childrenWithUnpersistedChanges: Set<InternalStateNode> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityAccessor.EntityEventType]: Set<EntityAccessor.EntityEventListenerMap[Type]> | undefined
	}
	fields: Map<FieldName, InternalStateNode>
	id: string | EntityAccessor.UnpersistedEntityId
	persistedData: AccessorTreeGenerator.InitialEntityData
	isScheduledForDeletion: boolean
	plannedRemovals: Set<InternalEntityFieldPlannedRemoval> | undefined

	// Entity realms address the fact that a single particular entity may appear several times throughout the tree in
	// completely different contexts. Even with different fields.
	// TODO it is rather unfortunate that we're effectively mandating EntityFieldMarkers to be unique across the tree.
	//  It is really just an implementation detail which ideally shouldn't have any bearing on the developer.
	//  It could probably just be a Set<OnEntityFieldUpdate>
	realms: Map<EntityFieldMarkers, OnEntityFieldUpdate>
	batchUpdates: EntityAccessor.BatchUpdates
	connectEntityAtField: EntityAccessor.ConnectEntityAtField
	disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField
	deleteEntity: EntityAccessor.DeleteEntity
}
