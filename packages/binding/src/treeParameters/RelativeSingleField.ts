import type { AnyField, SugarableAnyField } from './AnyField'
import type { HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type { LeafField, UnsugarableLeafField } from './LeafField'

export interface RelativeSingleField extends AnyField, LeafField {
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableRelativeSingleField extends SugarableAnyField {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableRelativeSingleField extends UnsugarableLeafField {
	// Deliberately leaving out UnsugarableHasOneRelation
}

export interface SugaredRelativeSingleField extends UnsugarableRelativeSingleField {
	// E.g. authors(id = 123).person.name
	field: string | SugarableRelativeSingleField
}
