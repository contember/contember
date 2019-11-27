import { HasManyRelation, SugarableHasManyRelation, UnsugarableHasManyRelation } from './HasManyRelation'
import { SugarableHasOneRelation } from './HasOneRelation'
import {
	RelativeSingleEntity,
	SugarableRelativeSingleEntity,
	UnsugarableRelativeSingleEntity,
} from './RelativeSingleEntity'

export interface RelativeEntityList extends RelativeSingleEntity {
	hasManyRelation: HasManyRelation
}

export interface SugarableRelativeEntityList extends SugarableRelativeSingleEntity {
	hasManyRelation: SugarableHasManyRelation
}

export interface UnsugarableRelativeEntityList extends UnsugarableRelativeSingleEntity {}

export interface SugaredRelativeEntityList extends UnsugarableRelativeEntityList {
	// E.g. genres(slug = 'sciFi').authors[age < 123]
	relativeEntityList: string | SugarableRelativeEntityList
}
