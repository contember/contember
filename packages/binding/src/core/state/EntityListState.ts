import type { EntityListAccessor, ErrorAccessor } from '../../accessors'
import type { EntityListSubTreeMarker, HasManyRelationMarker } from '../../markers'
import type {
	EntityEventListenerStore,
	EntityId,
	EntityListEventListenerStore,
	EntityName,
	RemovalType,
} from '../../treeParameters'
import type { BijectiveIndexedMap } from '../../structures'
import type { EntityRealmState, EntityRealmStateStub } from './EntityRealmState'
import type { StateType } from './StateType'

export type EntityListBlueprint =
	| {
			readonly marker: HasManyRelationMarker
			readonly parent: EntityRealmState
	  }
	| {
			readonly marker: EntityListSubTreeMarker
			readonly parent: undefined
	  }

export interface EntityListState {
	type: StateType.EntityList

	accessor: EntityListAccessor | undefined
	blueprint: EntityListBlueprint
	children: BijectiveIndexedMap<EntityId, EntityRealmState | EntityRealmStateStub>
	childrenWithPendingUpdates: Set<EntityRealmState> | undefined
	entityName: EntityName
	errors: ErrorAccessor | undefined
	eventListeners: EntityListEventListenerStore | undefined
	childEventListeners: EntityEventListenerStore | undefined
	readonly getAccessor: () => EntityListAccessor
	plannedRemovals: Map<EntityId, RemovalType> | undefined
	unpersistedChangesCount: number
}
