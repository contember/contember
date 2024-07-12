import type { RuntimeId, UnpersistedEntityDummyId } from '../../accessorTree'
import type { EntityName, EntityRealmKey } from '../../treeParameters'
import type { EntityRealmState, EntityRealmStateStub } from './EntityRealmState'

export interface EntityState {
	entityName: EntityName
	hasIdSetInStone: boolean // Initially, ids may be changed but only up to a certain point. This marks that point.
	id: RuntimeId
	isScheduledForDeletion: boolean
	maidenId: UnpersistedEntityDummyId | undefined
	realms: Map<EntityRealmKey, EntityRealmState | EntityRealmStateStub>
}
