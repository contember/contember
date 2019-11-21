import { FieldName } from './FieldName'
import { QualifiedEntityList } from './QualifiedEntityList'

export interface QualifiedFieldList extends QualifiedEntityList {
	fieldName: FieldName
}

// E.g. Author[age < 123].son.sister.name
export type SugaredQualifiedFieldList = QualifiedFieldList | string
