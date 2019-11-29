import {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import {
	DesugaredEntityListParameters,
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import {
	DesugaredQualifiedEntityParameters,
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'
import {
	DesugaredRelativeSingleEntity,
	RelativeSingleEntity,
	SugarableRelativeSingleEntity,
	UnsugarableRelativeSingleEntity,
} from './RelativeSingleEntity'

export interface DesugaredQualifiedEntityList
	extends DesugaredRelativeSingleEntity,
		DesugaredEntityListParameters,
		DesugaredQualifiedEntityParameters,
		DesugaredEntityCreationParameters {}

export interface QualifiedEntityList
	extends RelativeSingleEntity,
		EntityListParameters,
		QualifiedEntityParameters,
		EntityCreationParameters {}

export interface SugarableQualifiedEntityList
	extends SugarableRelativeSingleEntity,
		SugarableEntityListParameters,
		SugarableQualifiedEntityParameters,
		SugarableEntityCreationParameters {}

export interface UnsugarableQualifiedEntityList
	extends UnsugarableRelativeSingleEntity,
		UnsugarableEntityListParameters,
		UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters {}

// E.g. Author[age < 123].son.sisters(name = 'Jane')
export interface SugaredQualifiedEntityList extends UnsugarableQualifiedEntityList {
	entities: string | SugarableQualifiedEntityList
}
