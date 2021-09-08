import type { UnsugarableEntityListEventListeners } from './EntityListEventListeners'
import type { UnsugarableEntityListParameters } from './EntityListParameters'
import type { HasManyRelation, SugarableHasManyRelation } from './HasManyRelation'
import type { HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type { UnsugarableRelation } from './Relation'

export interface RelativeEntityList {
	hasOneRelationPath: HasOneRelation[]
	hasManyRelation: HasManyRelation
}

export interface SugarableRelativeEntityList {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
	hasManyRelation: SugarableHasManyRelation
}

export interface UnsugarableRelativeEntityList
	extends UnsugarableRelation,
		UnsugarableEntityListParameters,
		UnsugarableEntityListEventListeners {}

export interface SugaredRelativeEntityList extends UnsugarableRelativeEntityList {
	// E.g. genres(slug = 'sciFi').authors[age < 123]
	field: string | SugarableRelativeEntityList
}
