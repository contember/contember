import { EntityAccessor, ErrorAccessor } from '../../accessors'
import { SingleEntityPersistedData } from '../../accessorTree'
import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import { EntityCreationParameters, FieldName, SingleEntityEventListeners } from '../../treeParameters'
import { EntityRealm } from './EntityRealm'
import { StateNode } from './StateNode'
import { StateType } from './StateType'

export type OnEntityUpdate = (state: StateNode) => void
export type OnEntityFieldUpdate = (state: StateNode) => void
export interface EntityState {
	type: StateType.SingleEntity
	eventListeners: SingleEntityEventListeners['eventListeners']
	environment: Environment
	batchUpdateDepth: number
	childrenWithPendingUpdates: Set<StateNode> | undefined
	errors: ErrorAccessor | undefined
	fields: Map<FieldName, StateNode>
	fieldsWithPendingConnectionUpdates: Set<FieldName> | undefined
	getAccessor: EntityAccessor.GetEntityAccessor
	hasIdSetInStone: boolean // Initially, ids may be changed but only up to a certain point. This marks that point.
	hasPendingUpdate: boolean
	hasPendingParentNotification: boolean
	hasStaleAccessor: boolean
	id: EntityAccessor.RuntimeId
	isScheduledForDeletion: boolean
	onChildFieldUpdate: OnEntityFieldUpdate // To be called by the child to inform this entity
	maidenKey: string | undefined // undefined for persisted entities
	persistedData: SingleEntityPersistedData | undefined
	plannedHasOneDeletions: Map<FieldName, EntityState> | undefined

	// Entity realms address the fact that a single particular entity may appear several times throughout the tree in
	// completely different contexts. Even with different fields.
	realms: Map<OnEntityUpdate, EntityRealm> // TODO this should be indexed by something like [OnEntityUpdate, PlaceholderName]
	typeName: string | undefined

	// TODO these are really caches of values computed from the realms. This needs fixed.
	combinedMarkersContainer: EntityFieldMarkersContainer // Includes all realms
	combinedCreationParameters: EntityCreationParameters

	addError: EntityAccessor.AddError
	addEventListener: EntityAccessor.AddEntityEventListener
	batchUpdates: EntityAccessor.BatchUpdates
	connectEntityAtField: EntityAccessor.ConnectEntityAtField
	deleteEntity: EntityAccessor.DeleteEntity
	disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField
}
