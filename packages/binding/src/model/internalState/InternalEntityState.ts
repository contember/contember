import { EntityAccessor } from '../../accessors'
import { SingleEntityPersistedData } from '../../accessorTree'
import { FieldName, RemovalType } from '../../treeParameters/primitives'
import { ErrorsPreprocessor } from '../ErrorsPreprocessor'
import { InternalStateNode } from './InternalStateNode'
import { InternalStateType } from './InternalStateType'

export interface InternalEntityFieldPlannedRemoval {
	field: FieldName
	removalType: RemovalType
	removedEntity: InternalEntityState
}

export type OnEntityUpdate = (state: InternalStateNode) => void
export type OnEntityFieldUpdate = (state: InternalStateNode) => void
export interface InternalEntityState {
	type: InternalStateType.SingleEntity
	eventListeners: {
		[Type in EntityAccessor.EntityEventType]: Set<EntityAccessor.EntityEventListenerMap[Type]> | undefined
	}
	batchUpdateDepth: number
	childrenWithPendingUpdates: Set<InternalStateNode> | undefined
	//childrenWithUnpersistedChanges: Set<InternalStateNode> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	fields: Map<FieldName, InternalStateNode>
	getAccessor: () => EntityAccessor
	hasPendingUpdate: boolean
	hasPendingParentNotification: boolean
	hasStaleAccessor: boolean
	id: string | EntityAccessor.UnpersistedEntityId
	isScheduledForDeletion: boolean
	onChildFieldUpdate: OnEntityFieldUpdate // To be called by the child to inform this entity
	persistedData: SingleEntityPersistedData | undefined
	plannedRemovals: Set<InternalEntityFieldPlannedRemoval> | undefined

	// Entity realms address the fact that a single particular entity may appear several times throughout the tree in
	// completely different contexts. Even with different fields.
	realms: Set<OnEntityUpdate>
	typeName: string | undefined

	addEventListener: EntityAccessor.AddEntityEventListener
	batchUpdates: EntityAccessor.BatchUpdates
	connectEntityAtField: EntityAccessor.ConnectEntityAtField
	deleteEntity: EntityAccessor.DeleteEntity
	disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField
}
