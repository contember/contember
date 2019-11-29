import {
	DesugaredEntityListParameters,
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import { DesugaredRelation, Relation, SugarableRelation, UnsugarableRelation } from './Relation'

export interface DesugaredHasManyRelation extends DesugaredRelation, DesugaredEntityListParameters {}

export interface HasManyRelation extends Relation, EntityListParameters {}

export interface SugarableHasManyRelation extends SugarableRelation, SugarableEntityListParameters {}

export interface UnsugarableHasManyRelation extends UnsugarableRelation, UnsugarableEntityListParameters {}
