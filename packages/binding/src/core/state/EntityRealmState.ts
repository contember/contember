import { EntityAccessor, ErrorAccessor } from '../../accessors'
import { Environment } from '../../dao'
import { EntityFieldMarkersContainer } from '../../markers'
import { EntityCreationParameters, FieldName, PlaceholderName, SingleEntityEventListeners } from '../../treeParameters'
import { EntityListState } from './EntityListState'
import { EntityState } from './EntityState'
import { StateNode } from './StateNode'
import { StateType } from './StateType'

/**
 * @see RealmKeyGenerator
 */
export type EntityRealmKey = string

export type EntityRealmParent = EntityRealmState | EntityListState | undefined

export interface EntityRealmBlueprint {
	readonly creationParameters: EntityCreationParameters
	readonly environment: Environment
	readonly initialEventListeners: SingleEntityEventListeners | undefined
	readonly markersContainer: EntityFieldMarkersContainer
	readonly parent: EntityRealmParent
	readonly placeholderName: PlaceholderName
}

export interface EntityRealmStateStub {
	readonly type: StateType.EntityRealmStub

	readonly blueprint: EntityRealmBlueprint
	readonly entity: EntityState
	readonly realmKey: EntityRealmKey

	readonly getAccessor: EntityAccessor.GetEntityAccessor
}

/*
 * Entity realms address the fact that a single particular entity may appear several times throughout the tree in
 * completely different contexts. Even with different fields.
 */
export interface EntityRealmState {
	readonly type: StateType.EntityRealm

	readonly blueprint: EntityRealmBlueprint
	entity: EntityState
	readonly realmKey: EntityRealmKey

	readonly children: Map<PlaceholderName, StateNode | EntityRealmStateStub>
	childrenWithPendingUpdates: Set<StateNode> | undefined
	errors: ErrorAccessor | undefined
	readonly eventListeners: SingleEntityEventListeners['eventListeners']
	fieldsWithPendingConnectionUpdates: Set<FieldName> | undefined
	hasPendingParentNotification: boolean
	hasStaleAccessor: boolean
	plannedHasOneDeletions: Map<PlaceholderName, EntityRealmState | EntityRealmStateStub> | undefined
	unpersistedChangesCount: number

	readonly addError: EntityAccessor.AddError
	readonly addEventListener: EntityAccessor.AddEntityEventListener
	readonly batchUpdates: EntityAccessor.BatchUpdates
	readonly connectEntityAtField: EntityAccessor.ConnectEntityAtField
	readonly disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField
	readonly getAccessor: EntityAccessor.GetEntityAccessor
}
