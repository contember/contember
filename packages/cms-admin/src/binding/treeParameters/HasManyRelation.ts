import { FieldName } from './FieldName'
import { Filter } from './Filter'

export interface HasManyRelation {
	field: FieldName
	filter?: Filter
}
