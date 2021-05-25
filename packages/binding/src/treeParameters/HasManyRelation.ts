import type {
	DesugaredEntityListEventListeners,
	EntityListEventListeners,
	SugarableEntityListEventListeners,
	UnsugarableEntityListEventListeners,
} from './EntityListEventListeners'
import type {
	DesugaredEntityListParameters,
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import type { DesugaredRelation, Relation, SugarableRelation, UnsugarableRelation } from './Relation'

export interface DesugaredHasManyRelation
	extends DesugaredRelation,
		DesugaredEntityListParameters,
		DesugaredEntityListEventListeners {}

export interface HasManyRelation extends Relation, EntityListParameters, EntityListEventListeners {}

export interface SugarableHasManyRelation
	extends SugarableRelation,
		SugarableEntityListParameters,
		SugarableEntityListEventListeners {}

export interface UnsugarableHasManyRelation
	extends UnsugarableRelation,
		UnsugarableEntityListParameters,
		UnsugarableEntityListEventListeners {}
