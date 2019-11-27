import {
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import {
	EntityTreeParameters,
	SugarableEntityTreeParameters,
	UnsugarableEntityTreeParameters,
} from './EntityTreeParameters'
import {
	RelativeSingleEntity,
	SugarableRelativeSingleEntity,
	UnsugarableRelativeSingleEntity,
} from './RelativeSingleEntity'

export interface QualifiedEntityList extends RelativeSingleEntity, EntityListParameters, EntityTreeParameters {}

export interface SugarableQualifiedEntityList
	extends SugarableRelativeSingleEntity,
		SugarableEntityListParameters,
		SugarableEntityTreeParameters {}

export interface UnsugarableQualifiedEntityList
	extends UnsugarableRelativeSingleEntity,
		UnsugarableEntityListParameters,
		UnsugarableEntityTreeParameters {}

// E.g. Author[age < 123].son.sisters(name = 'Jane')
export interface SugaredQualifiedEntityList extends UnsugarableQualifiedEntityList {
	qualifiedEntityList: string | SugarableQualifiedEntityList
}
