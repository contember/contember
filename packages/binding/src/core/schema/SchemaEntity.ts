import type { EntityName } from '../../treeParameters'
import type { SchemaFields } from './SchemaFields'
import type { SchemaUniqueConstraint } from './SchemaUniqueConstraint'

export interface SchemaEntity {
	name: EntityName
	customPrimaryAllowed: boolean
	fields: SchemaFields
	unique: SchemaUniqueConstraint[]
}
