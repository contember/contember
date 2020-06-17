import { EntityAccessor } from '../../accessors'
import { SingleEntityPersistedData } from '../../accessorTree'
import { FieldName, RemovalType } from '../../treeParameters/primitives'
import { ErrorsPreprocessor } from '../ErrorsPreprocessor'
import { InternalContainerState } from './InternalContainerState'
import { InternalStateNode } from './InternalStateNode'
import { InternalStateType } from './InternalStateType'

export interface InternalEntityFieldPlannedRemoval {
	field: FieldName
	removalType: RemovalType
	removedEntity: InternalEntityState
}

export type OnEntityUpdate = (state: InternalStateNode) => void
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
	typeName: string | undefined
	persistedData: SingleEntityPersistedData | undefined
	isScheduledForDeletion: boolean
	plannedRemovals: Set<InternalEntityFieldPlannedRemoval> | undefined
	onChildFieldUpdate: OnEntityFieldUpdate // To be called by the child to inform this entity

	// Entity realms address the fact that a single particular entity may appear several times throughout the tree in
	// completely different contexts. Even with different fields.
	realms: Set<OnEntityUpdate>
	batchUpdates: EntityAccessor.BatchUpdates
	connectEntityAtField: EntityAccessor.ConnectEntityAtField
	disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField
	deleteEntity: EntityAccessor.DeleteEntity
}
