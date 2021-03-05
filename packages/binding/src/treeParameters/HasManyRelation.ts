import {
	DesugaredEntityListEventListeners,
	EntityListEventListeners,
	SugarableEntityListEventListeners,
	UnsugarableEntityListEventListeners,
} from './EntityListEventListeners'
import {
	DesugaredEntityListParameters,
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import { DesugaredRelation, Relation, SugarableRelation, UnsugarableRelation } from './Relation'

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
