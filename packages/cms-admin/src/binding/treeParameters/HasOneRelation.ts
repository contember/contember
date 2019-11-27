import { SugaredUniqueWhere, UniqueWhere } from './primitives'
import { Relation, SugarableRelation, UnsugarableRelation } from './Relation'
import {
	SingleEntityParameters,
	SugarableSingleEntityParameters,
	UnsugarableSingleEntityParameters,
} from './SingleEntityParameters'

export interface HasOneRelation extends Relation, SingleEntityParameters {
	reducedBy: UniqueWhere | undefined
}

export interface SugarableHasOneRelation extends SugarableRelation, SugarableSingleEntityParameters {
	reducedBy?: SugaredUniqueWhere
}

export interface UnsugarableHasOneRelation extends UnsugarableRelation, UnsugarableSingleEntityParameters {}
