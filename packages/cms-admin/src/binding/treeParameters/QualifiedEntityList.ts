import { EntityName } from './EntityName'
import { Filter } from './Filter'
import { RelativeSingleEntity } from './RelativeSingleEntity'

export interface QualifiedEntityList extends RelativeSingleEntity {
	entityName: EntityName
	filter?: Filter
}

// E.g. Author[age < 123].son.sisters(name = 'Jane')
export type SugaredQualifiedEntityList = QualifiedEntityList | string
