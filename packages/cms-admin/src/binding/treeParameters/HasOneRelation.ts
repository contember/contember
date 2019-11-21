import { FieldName } from './FieldName'
import { Filter } from './Filter'
import { UniqueWhere } from './UniqueWhere'

export interface HasOneRelation {
	field: FieldName
	filter?: Filter
	reducedBy?: UniqueWhere
}
