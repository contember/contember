import { FieldName } from './FieldName'
import { RelativeSingleEntity } from './RelativeSingleEntity'

export interface RelativeSingleField extends RelativeSingleEntity {
	fieldName: FieldName
}

// E.g. authors(id = 123).person.name
export type SugaredRelativeSingleField = RelativeSingleField | string
