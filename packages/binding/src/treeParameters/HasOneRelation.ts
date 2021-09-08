import type { SugaredUniqueWhere, UniqueWhere } from './primitives'
import type { Relation, SugarableRelation, UnsugarableRelation } from './Relation'
import type {
	SingleEntityEventListeners,
	SugarableSingleEntityEventListeners,
	UnsugarableSingleEntityEventListeners,
} from './SingleEntityEventListeners'
import type {
	SingleEntityParameters,
	SugarableSingleEntityParameters,
	UnsugarableSingleEntityParameters,
} from './SingleEntityParameters'

export interface HasOneRelation extends Relation, SingleEntityParameters, SingleEntityEventListeners {
	reducedBy: UniqueWhere | undefined
}

export interface SugarableHasOneRelation
	extends SugarableRelation,
		SugarableSingleEntityParameters,
		SugarableSingleEntityEventListeners {
	reducedBy?: SugaredUniqueWhere
}

export interface UnsugarableHasOneRelation
	extends UnsugarableRelation,
		UnsugarableSingleEntityParameters,
		UnsugarableSingleEntityEventListeners {}
