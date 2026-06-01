import type { FieldName } from '../treeParameters/index.js'

export interface SchemaUniqueConstraint {
	fields: Set<FieldName>
}
