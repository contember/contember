import type { EntityAccessor, ErrorAccessor } from '@contember/binding-common'
import type { EntitySubTreeMarker, HasOneRelationMarker } from '@contember/binding-common'
import type { EntityEventListenerStore, EntityRealmKey, FieldName, PlaceholderName } from '@contember/binding-common'
import type { EntityListState } from './EntityListState'
import type { EntityState } from './EntityState'
import type { StateNode } from './StateNode'

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
	readonly type: 'entityRealmStub'

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
	readonly type: 'entityRealm'

	readonly blueprint: EntityRealmBlueprint
	entity: EntityState
	realmKey: EntityRealmKey

	accessor: EntityAccessor | undefined
	readonly children: Map<PlaceholderName, StateNode | EntityRealmStateStub>
	childrenWithPendingUpdates: Set<StateNode> | undefined
	errors: ErrorAccessor | undefined
	eventListeners: EntityEventListenerStore | undefined
	fieldsWithPendingConnectionUpdates: Set<FieldName> | undefined

	// TODO Why does this even exist?
	plannedHasOneDeletions: Map<PlaceholderName, EntityRealmState | EntityRealmStateStub> | undefined
	unpersistedChangesCount: number

	readonly getAccessor: EntityAccessor.GetEntityAccessor
}
