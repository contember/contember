import {
	DesugaredEntityListParameters,
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import {
	DesugaredEntityListStaticEvents,
	EntityListStaticEvents,
	SugarableEntityListStaticEvents,
	UnsugarableEntityListStaticEvents,
} from './EntityListStaticEvents'
import { DesugaredRelation, Relation, SugarableRelation, UnsugarableRelation } from './Relation'

export interface DesugaredHasManyRelation
	extends DesugaredRelation,
		DesugaredEntityListParameters,
		DesugaredEntityListStaticEvents {}

export interface HasManyRelation extends Relation, EntityListParameters, EntityListStaticEvents {}

export interface SugarableHasManyRelation
	extends SugarableRelation,
		SugarableEntityListParameters,
		SugarableEntityListStaticEvents {}

export interface UnsugarableHasManyRelation
	extends UnsugarableRelation,
		UnsugarableEntityListParameters,
		UnsugarableEntityListStaticEvents {}
