import { EntityAccessor, ErrorAccessor } from '../../accessors'
import { SingleEntityPersistedData } from '../../accessorTree'
import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import { EntityCreationParameters, FieldName, SingleEntityEventListeners } from '../../treeParameters'
import { EntityRealmSet } from './EntityRealmSet'
import { StateNode } from './StateNode'
import { StateType } from './StateType'

export type OnEntityUpdate = (state: StateNode) => void
export type OnEntityFieldUpdate = (state: StateNode) => void
export interface EntityState {
	type: StateType.Entity
	eventListeners: SingleEntityEventListeners['eventListeners']
	batchUpdateDepth: number
	childrenWithPendingUpdates: Set<StateNode> | undefined
	errors: ErrorAccessor | undefined
	fields: Map<FieldName, StateNode>
	fieldsWithPendingConnectionUpdates: Set<FieldName> | undefined
	hasIdSetInStone: boolean // Initially, ids may be changed but only up to a certain point. This marks that point.
	hasPendingUpdate: boolean
	hasPendingParentNotification: boolean
	hasStaleAccessor: boolean
	id: EntityAccessor.RuntimeId
	isScheduledForDeletion: boolean
	onChildFieldUpdate: OnEntityFieldUpdate // To be called by the child to inform this entity
	maidenKey: string | undefined // undefined for persisted entities
	persistedData: SingleEntityPersistedData | undefined // TODO remove this
	plannedHasOneDeletions: Map<FieldName, EntityState> | undefined
	realms: EntityRealmSet
	typeName: string | undefined

	// TODO these are really caches of values computed from the realms. This needs fixed.
	combinedMarkersContainer: EntityFieldMarkersContainer // Includes all realms
	combinedCreationParameters: EntityCreationParameters
	combinedEnvironment: Environment

	addError: EntityAccessor.AddError
	addEventListener: EntityAccessor.AddEntityEventListener
	batchUpdates: EntityAccessor.BatchUpdates
	connectEntityAtField: EntityAccessor.ConnectEntityAtField
	deleteEntity: EntityAccessor.DeleteEntity
	disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField
	getAccessor: EntityAccessor.GetEntityAccessor
}
