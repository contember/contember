import { UnsugarableEntityListEventListeners } from './EntityListEventListeners'
import { UnsugarableEntityListParameters } from './EntityListParameters'
import { DesugaredHasManyRelation, HasManyRelation, SugarableHasManyRelation } from './HasManyRelation'
import { DesugaredHasOneRelation, HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import { UnsugarableRelation } from './Relation'

export interface DesugaredRelativeEntityList {
	hasOneRelationPath: DesugaredHasOneRelation[]
	hasManyRelation: DesugaredHasManyRelation
}

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
