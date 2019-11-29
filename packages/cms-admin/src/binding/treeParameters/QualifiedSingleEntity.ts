import {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
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
		DesugaredRelativeSingleEntity,
		DesugaredSingleEntityParameters,
		DesugaredQualifiedEntityParameters,
		DesugaredEntityCreationParameters {}

// TODO remove isNonbearing
export interface QualifiedSingleEntity
	extends QualifiedSingleEntityParameters,
		RelativeSingleEntity,
		SingleEntityParameters,
		QualifiedEntityParameters,
		EntityCreationParameters {}

export interface SugarableQualifiedSingleEntity
	extends SugarableQualifiedSingleEntityParameters,
		SugarableRelativeSingleEntity,
		SugarableSingleEntityParameters,
		SugarableQualifiedEntityParameters,
		SugarableEntityCreationParameters {}

export interface UnsugarableQualifiedSingleEntity
	extends UnsugarableQualifiedSingleEntityParameters,
		UnsugarableRelativeSingleEntity,
		UnsugarableSingleEntityParameters,
		UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters {}

export interface SugaredQualifiedSingleEntity extends UnsugarableQualifiedSingleEntity {
	entity: string | SugarableQualifiedSingleEntity
}
