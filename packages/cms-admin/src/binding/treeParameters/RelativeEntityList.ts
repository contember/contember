import { HasManyRelation } from './HasManyRelation'
import { RelativeSingleEntity } from './RelativeSingleEntity'

export interface RelativeEntityList extends RelativeSingleEntity {
	hasManyRelationPath: HasManyRelation
}

// E.g. genres(slug = 'sciFi').authors[age < 123]
export type SugaredRelativeEntityList = RelativeEntityList | string
