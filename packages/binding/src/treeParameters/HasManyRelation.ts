import type { EntityListEventListeners } from './EntityListEventListeners'
import type { EntityListParameters } from './EntityListParameters'
import type { Relation } from './Relation'

export interface HasManyRelation extends Relation, EntityListParameters, EntityListEventListeners {}
