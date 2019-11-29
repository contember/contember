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

export interface DesugaredUnconstrainedQualifiedEntityList
	extends DesugaredRelativeSingleEntity,
		DesugaredQualifiedEntityParameters {}

export interface UnconstrainedQualifiedEntityList extends RelativeSingleEntity, QualifiedEntityParameters {}

export interface SugarableUnconstrainedQualifiedEntityList
	extends SugarableRelativeSingleEntity,
		SugarableQualifiedEntityParameters {}

export interface UnsugarableUnconstrainedQualifiedEntityList
	extends UnsugarableRelativeSingleEntity,
		UnsugarableQualifiedEntityParameters {}

// E.g. Author.son.sisters(name = 'Jane')
export interface SugaredUnconstrainedQualifiedEntityList extends UnsugarableUnconstrainedQualifiedEntityList {
	unconstrainedQualifiedEntityList: string | SugarableUnconstrainedQualifiedEntityList
}
