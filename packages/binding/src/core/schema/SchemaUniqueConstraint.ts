import type { FieldName } from '../../treeParameters'

export interface SchemaUniqueConstraint {
	fields: Set<FieldName>
}
