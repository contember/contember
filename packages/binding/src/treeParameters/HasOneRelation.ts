import { SugaredUniqueWhere, UniqueWhere } from './primitives'
import { DesugaredRelation, Relation, SugarableRelation, UnsugarableRelation } from './Relation'
import {
	DesugaredSingleEntityEventListeners,
	SingleEntityEventListeners,
	SugarableSingleEntityEventListeners,
	UnsugarableSingleEntityEventListeners,
} from './SingleEntityEventListeners'
import {
	DesugaredSingleEntityParameters,
	SingleEntityParameters,
	SugarableSingleEntityParameters,
	UnsugarableSingleEntityParameters,
} from './SingleEntityParameters'

export interface DesugaredHasOneRelation
	extends DesugaredRelation,
		DesugaredSingleEntityParameters,
		DesugaredSingleEntityEventListeners {
	reducedBy: UniqueWhere | undefined
}

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
