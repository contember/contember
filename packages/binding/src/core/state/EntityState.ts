import { EntityAccessor } from '../../accessors'
import { RuntimeId, UnpersistedEntityDummyId } from '../../accessorTree'
import { EntityName } from '../../treeParameters'
import { EntityRealmKey, EntityRealmState, EntityRealmStateStub } from './EntityRealmState'

export interface EntityState {
	entityName: EntityName
	hasIdSetInStone: boolean // Initially, ids may be changed but only up to a certain point. This marks that point.
	id: RuntimeId
	isScheduledForDeletion: boolean
	maidenId: UnpersistedEntityDummyId | undefined
	realms: Map<EntityRealmKey, EntityRealmState | EntityRealmStateStub>

	deleteEntity: EntityAccessor.DeleteEntity
}
