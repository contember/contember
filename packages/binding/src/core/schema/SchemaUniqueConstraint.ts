import { FieldName } from '../../treeParameters'

export interface SchemaUniqueConstraint {
	fields: Set<FieldName>
}
