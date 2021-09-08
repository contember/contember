import type {
	EntityListEventListeners,
	SugarableEntityListEventListeners,
	UnsugarableEntityListEventListeners,
} from './EntityListEventListeners'
import type {
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import type { Relation, SugarableRelation, UnsugarableRelation } from './Relation'

export interface HasManyRelation extends Relation, EntityListParameters, EntityListEventListeners {}

export interface SugarableHasManyRelation
	extends SugarableRelation,
		SugarableEntityListParameters,
		SugarableEntityListEventListeners {}

export interface UnsugarableHasManyRelation
	extends UnsugarableRelation,
		UnsugarableEntityListParameters,
		UnsugarableEntityListEventListeners {}
