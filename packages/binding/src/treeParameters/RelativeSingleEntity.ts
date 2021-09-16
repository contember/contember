import type { HasOneRelation, SugarableHasOneRelation, UnsugarableHasOneRelation } from './HasOneRelation'

export interface RelativeSingleEntity {
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableRelativeSingleEntity {
	hasOneRelationPath: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableRelativeSingleEntity extends UnsugarableHasOneRelation {}

export interface SugaredRelativeSingleEntity extends UnsugarableRelativeSingleEntity {
	// E.g. localesByLocale(locale.slug = en)
	field: string | SugarableHasOneRelation[] | SugarableHasOneRelation
}
