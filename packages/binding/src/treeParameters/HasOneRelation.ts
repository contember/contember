import { SugaredUniqueWhere, UniqueWhere } from './primitives'
import { DesugaredRelation, Relation, SugarableRelation, UnsugarableRelation } from './Relation'
import {
	DesugaredSingleEntityParameters,
	SingleEntityParameters,
	SugarableSingleEntityParameters,
	UnsugarableSingleEntityParameters,
} from './SingleEntityParameters'

export interface DesugaredHasOneRelation extends DesugaredRelation, DesugaredSingleEntityParameters {
	reducedBy: UniqueWhere | undefined
}

export interface HasOneRelation extends Relation, SingleEntityParameters {
	reducedBy: UniqueWhere | undefined
}

export interface SugarableHasOneRelation extends SugarableRelation, SugarableSingleEntityParameters {
	reducedBy?: SugaredUniqueWhere
}

export interface UnsugarableHasOneRelation extends UnsugarableRelation, UnsugarableSingleEntityParameters {}
