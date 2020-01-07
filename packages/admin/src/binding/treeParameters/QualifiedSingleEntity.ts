import {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import { DesugaredHasOneRelation, HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import {
	DesugaredQualifiedEntityParameters,
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'
import {
	DesugaredQualifiedSingleEntityParameters,
	QualifiedSingleEntityParameters,
	SugarableQualifiedSingleEntityParameters,
	UnsugarableQualifiedSingleEntityParameters,
} from './QualifiedSingleEntityParameters'
import {
	DesugaredRelativeSingleEntity,
	RelativeSingleEntity,
	SugarableRelativeSingleEntity,
	UnsugarableRelativeSingleEntity,
} from './RelativeSingleEntity'
import {
	DesugaredSingleEntityParameters,
	SingleEntityParameters,
	SugarableSingleEntityParameters,
	UnsugarableSingleEntityParameters,
} from './SingleEntityParameters'

export interface DesugaredQualifiedSingleEntity
	extends DesugaredQualifiedSingleEntityParameters,
		DesugaredSingleEntityParameters,
		DesugaredQualifiedEntityParameters,
		DesugaredEntityCreationParameters {
	hasOneRelationPath: DesugaredHasOneRelation[]
}

export interface QualifiedSingleEntity
	extends QualifiedSingleEntityParameters,
		SingleEntityParameters,
		QualifiedEntityParameters,
		EntityCreationParameters {
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableQualifiedSingleEntity
	extends SugarableQualifiedSingleEntityParameters,
		SugarableSingleEntityParameters,
		SugarableQualifiedEntityParameters,
		SugarableEntityCreationParameters {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableQualifiedSingleEntity
	extends UnsugarableQualifiedSingleEntityParameters,
		UnsugarableSingleEntityParameters,
		UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters {
	// Deliberately leaving out UnsugarableHasOneRelation
}

export interface SugaredQualifiedSingleEntity extends UnsugarableQualifiedSingleEntity {
	entity: string | SugarableQualifiedSingleEntity
}
