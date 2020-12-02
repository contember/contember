import { PlaceholderName } from '../../treeParameters'
import { EntityRealm, OnEntityUpdate } from './EntityRealm'

export type EntityRealmSet = EntityRealm | Map<OnEntityUpdate, Map<PlaceholderName, EntityRealm>>
