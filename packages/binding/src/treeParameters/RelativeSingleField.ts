import type { AnyField, SugarableAnyField } from './AnyField'
import type { HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type { LeafField, UnsugarableLeafField } from './LeafField'

export type RelativeSingleField =
	& AnyField
	& LeafField
	& {
		hasOneRelationPath: HasOneRelation[]
	}

export type SugarableRelativeSingleField =
	& SugarableAnyField
	& {
		hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
	}

export type UnsugarableRelativeSingleField =
	& UnsugarableLeafField
	// Deliberately leaving out UnsugarableHasOneRelation

export type SugaredRelativeSingleField =
	& UnsugarableRelativeSingleField
	& {
		/** E.g. authors(id = 123).person.name */
		field: string | SugarableRelativeSingleField
	}
