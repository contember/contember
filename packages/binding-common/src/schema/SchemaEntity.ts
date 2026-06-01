import type { EntityName } from '../treeParameters/index.js'
import type { SchemaFields } from './SchemaFields.js'
import type { SchemaUniqueConstraint } from './SchemaUniqueConstraint.js'

export interface SchemaEntity {
	name: EntityName
	customPrimaryAllowed: boolean
	fields: SchemaFields
	unique: SchemaUniqueConstraint[]
}
