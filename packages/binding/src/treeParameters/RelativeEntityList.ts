import type { HasManyRelation } from './HasManyRelation'
import type { HasOneRelation } from './HasOneRelation'

export interface RelativeEntityList {
	hasOneRelationPath: HasOneRelation[]
	hasManyRelation: HasManyRelation
}

