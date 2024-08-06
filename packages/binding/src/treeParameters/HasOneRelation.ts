import type { UniqueWhere } from './primitives'
import type { Relation } from './Relation'
import type { SingleEntityEventListeners } from './SingleEntityEventListeners'
import type { SingleEntityParameters } from './SingleEntityParameters'

export interface HasOneRelation extends Relation, SingleEntityParameters, SingleEntityEventListeners {
	reducedBy: UniqueWhere | undefined
}
