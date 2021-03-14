import { AnyField, DesugaredAnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import {
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import { DesugaredHasOneRelation, HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import { DesugaredLeafField, LeafField, SugarableLeafField, UnsugarableLeafField } from './LeafField'
import { DesugaredQualifiedEntityList } from './QualifiedEntityList'
import {
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
