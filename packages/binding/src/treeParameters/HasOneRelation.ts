import { SugaredUniqueWhere, UniqueWhere } from './primitives'
import { DesugaredRelation, Relation, SugarableRelation, UnsugarableRelation } from './Relation'
import {
	DesugaredSingleEntityParameters,
	SingleEntityParameters,
	SugarableSingleEntityParameters,
	UnsugarableSingleEntityParameters,
} from './SingleEntityParameters'
import {
	DesugaredSingleEntityStaticEvents,
	SingleEntityStaticEvents,
	SugarableSingleEntityStaticEvents,
	UnsugarableSingleEntityStaticEvents,
} from './SingleEntityStaticEvents'

export interface DesugaredHasOneRelation
	extends DesugaredRelation,
		DesugaredSingleEntityParameters,
		DesugaredSingleEntityStaticEvents {
	reducedBy: UniqueWhere | undefined
}

export interface HasOneRelation extends Relation, SingleEntityParameters, SingleEntityStaticEvents {
	reducedBy: UniqueWhere | undefined
}

export interface SugarableHasOneRelation
	extends SugarableRelation,
		SugarableSingleEntityParameters,
		SugarableSingleEntityStaticEvents {
	reducedBy?: SugaredUniqueWhere
}

export interface UnsugarableHasOneRelation
	extends UnsugarableRelation,
		UnsugarableSingleEntityParameters,
		UnsugarableSingleEntityStaticEvents {}
