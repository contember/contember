import type { AnyField, DesugaredAnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import type {
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import type { DesugaredHasOneRelation, HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type { DesugaredLeafField, LeafField, SugarableLeafField, UnsugarableLeafField } from './LeafField'
import type { DesugaredQualifiedEntityList } from './QualifiedEntityList'
import type {
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'

export interface DesugaredQualifiedFieldList
	extends DesugaredQualifiedEntityList,
		DesugaredAnyField,
		DesugaredLeafField {
	hasOneRelationPath: DesugaredHasOneRelation[]
}

export interface QualifiedFieldList extends EntityListParameters, QualifiedEntityParameters, AnyField, LeafField {
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableQualifiedFieldList
	extends SugarableEntityListParameters,
		SugarableQualifiedEntityParameters,
		SugarableAnyField,
		SugarableLeafField {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableQualifiedFieldList
	extends UnsugarableEntityListParameters,
		UnsugarableQualifiedEntityParameters,
		UnsugarableAnyField,
		UnsugarableLeafField {
	// Deliberately leaving out UnsugarableHasOneRelation
}

// E.g. Author[age < 123].son.sister.name
export interface SugaredQualifiedFieldList extends UnsugarableQualifiedFieldList {
	fields: string | SugarableQualifiedFieldList
}
