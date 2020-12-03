import { EntityAccessor } from '../../accessors'
import { EntityRealmSet } from './EntityRealmSet'
import { StateType } from './StateType'

export interface EntityStateStub {
	type: StateType.EntityStub
	id: EntityAccessor.RuntimeId
	realms: EntityRealmSet
	getAccessor: EntityAccessor.GetEntityAccessor
}
