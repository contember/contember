import { EntityAccessor, ErrorAccessor } from '../../accessors'
import { EntitySubTreeMarker, HasOneRelationMarker } from '../../markers'
import { EntityEventListenerStore, EntityRealmKey, FieldName, PlaceholderName } from '../../treeParameters'
import { EntityListState } from './EntityListState'
import { EntityState } from './EntityState'
import { StateNode } from './StateNode'
import { StateType } from './StateType'

export interface HasOneEntityRealmBlueprint {
	readonly type: 'hasOne'
	readonly marker: HasOneRelationMarker
	readonly parent: EntityRealmState
}

export interface ListEntityEntityRealmBlueprint {
	readonly type: 'listEntity'
	readonly parent: EntityListState
}

export interface SubTreeEntityRealmBlueprint {
	readonly type: 'subTree'
	readonly marker: EntitySubTreeMarker
	readonly parent: undefined
}

export type EntityRealmBlueprint =
	| HasOneEntityRealmBlueprint
	| ListEntityEntityRealmBlueprint
	| SubTreeEntityRealmBlueprint

export interface EntityRealmStateStub {
	readonly type: StateType.EntityRealmStub

	readonly blueprint: EntityRealmBlueprint
	entity: EntityState
	realmKey: EntityRealmKey

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
	realmKey: EntityRealmKey

	readonly children: Map<PlaceholderName, StateNode | EntityRealmStateStub>
	childrenWithPendingUpdates: Set<StateNode> | undefined
	errors: ErrorAccessor | undefined
	eventListeners: EntityEventListenerStore | undefined
	fieldsWithPendingConnectionUpdates: Set<FieldName> | undefined
	hasStaleAccessor: boolean

	// TODO Why does this even exist?
	plannedHasOneDeletions: Map<PlaceholderName, EntityRealmState | EntityRealmStateStub> | undefined
	unpersistedChangesCount: number

	readonly addError: EntityAccessor.AddError
	readonly addEventListener: EntityAccessor.AddEntityEventListener
	readonly batchUpdates: EntityAccessor.BatchUpdates
	readonly connectEntityAtField: EntityAccessor.ConnectEntityAtField
	readonly disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField
	readonly getAccessor: EntityAccessor.GetEntityAccessor
}
