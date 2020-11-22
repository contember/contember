import { EntityAccessor, ErrorAccessor } from '../../accessors'
import { SingleEntityPersistedData } from '../../accessorTree'
import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import { EntityCreationParameters, FieldName, SingleEntityEventListeners } from '../../treeParameters'
import { InternalStateNode } from './InternalStateNode'
import { InternalStateType } from './InternalStateType'

export type OnEntityUpdate = (state: InternalStateNode) => void
export type OnEntityFieldUpdate = (state: InternalStateNode) => void
export interface InternalEntityState {
	type: InternalStateType.SingleEntity
	eventListeners: SingleEntityEventListeners['eventListeners']
	environment: Environment
	batchUpdateDepth: number
	childrenWithPendingUpdates: Set<InternalStateNode> | undefined
	creationParameters: EntityCreationParameters
	errors: ErrorAccessor | undefined
	fields: Map<FieldName, InternalStateNode>
	fieldsWithPendingConnectionUpdates: Set<FieldName> | undefined
	getAccessor: () => EntityAccessor
	hasIdSetInStone: boolean // Initially, ids may be changed but only up to a certain point. This marks that point.
	hasPendingUpdate: boolean
	hasPendingParentNotification: boolean
	hasStaleAccessor: boolean
	id: EntityAccessor.RuntimeId
	isScheduledForDeletion: boolean
	onChildFieldUpdate: OnEntityFieldUpdate // To be called by the child to inform this entity
	maidenKey: string | undefined // undefined for persisted entities
	markersContainer: EntityFieldMarkersContainer
	persistedData: SingleEntityPersistedData | undefined
	plannedHasOneDeletions: Map<FieldName, InternalEntityState> | undefined

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
