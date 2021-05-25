import type { AnyField, DesugaredAnyField, SugarableAnyField, UnsugarableAnyField } from './AnyField'
import type { DesugaredHasOneRelation, HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type { DesugaredLeafField, LeafField, SugarableLeafField, UnsugarableLeafField } from './LeafField'

export interface DesugaredRelativeSingleField extends DesugaredAnyField, DesugaredLeafField {
	hasOneRelationPath: DesugaredHasOneRelation[]
}

export interface RelativeSingleField extends AnyField, LeafField {
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableRelativeSingleField extends SugarableAnyField, SugarableLeafField {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableRelativeSingleField extends UnsugarableAnyField, UnsugarableLeafField {
	// Deliberately leaving out UnsugarableHasOneRelation
}

export interface SugaredRelativeSingleField extends UnsugarableRelativeSingleField {
	// E.g. authors(id = 123).person.name
	field: string | SugarableRelativeSingleField
}
