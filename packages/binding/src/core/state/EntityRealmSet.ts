import { EntityRealm } from './EntityRealm'
import { EntityRealmKey } from './EntityRealmKey'
import { EntityRealmParent } from './EntityRealmParent'

export type EntityRealmSet = Map<EntityRealmParent, Map<EntityRealmKey, EntityRealm>>
