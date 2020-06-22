import { HasManyRelation } from './HasManyRelation'
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

const x: HasOneRelation = {
	connections: undefined,
	field: '',
	filter: {},
	forceCreation: false,
	isNonbearing: false,
	reducedBy: undefined,
}

const y: HasManyRelation = {
	connections: undefined,
	field: '',
	filter: {},
	forceCreation: false,
	isNonbearing: false,
	initialEntityCount: 0,

	orderBy: undefined,
	offset: undefined,
	limit: undefined,
}
