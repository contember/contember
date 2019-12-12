import {
	DesugaredHasManyRelation,
	HasManyRelation,
	SugarableHasManyRelation,
	UnsugarableHasManyRelation,
} from './HasManyRelation'
import {
	DesugaredRelativeSingleEntity,
	RelativeSingleEntity,
	SugarableRelativeSingleEntity,
	UnsugarableRelativeSingleEntity,
} from './RelativeSingleEntity'

export interface DesugaredRelativeEntityList extends DesugaredRelativeSingleEntity {
	hasManyRelation: DesugaredHasManyRelation
}

export interface RelativeEntityList extends RelativeSingleEntity {
	hasManyRelation: HasManyRelation
}

export interface SugarableRelativeEntityList extends Partial<SugarableRelativeSingleEntity> {
	hasManyRelation: SugarableHasManyRelation
}

export interface UnsugarableRelativeEntityList extends UnsugarableHasManyRelation, UnsugarableRelativeSingleEntity {}

export interface SugaredRelativeEntityList extends UnsugarableRelativeEntityList {
	// E.g. genres(slug = 'sciFi').authors[age < 123]
	field: string | SugarableRelativeEntityList
}
