import type { AnyField, SugarableAnyField } from './AnyField'
import type {
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import type { HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type { LeafField, UnsugarableLeafField } from './LeafField'
import type {
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'

export type QualifiedFieldList =
	& EntityListParameters
	& QualifiedEntityParameters
	& AnyField
	& LeafField
	& {
		hasOneRelationPath: HasOneRelation[]
	}

export type SugarableQualifiedFieldList =
	& SugarableEntityListParameters
	& SugarableQualifiedEntityParameters
	& SugarableAnyField
	& {
		hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
	}

export type UnsugarableQualifiedFieldList =
	& UnsugarableEntityListParameters
	& UnsugarableQualifiedEntityParameters
	& UnsugarableLeafField
	// Deliberately leaving out UnsugarableHasOneRelation

// E.g. Author[age < 123].son.sister.name
export type SugaredQualifiedFieldList =
	& UnsugarableQualifiedFieldList
	& {
		fields: string | SugarableQualifiedFieldList
	}
