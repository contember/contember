import { EntityName } from '../../treeParameters'
import { SchemaFields } from './SchemaFields'
import { SchemaUniqueConstraint } from './SchemaUniqueConstraint'

export interface SchemaEntity {
	name: EntityName
	customPrimaryAllowed: boolean
	fields: SchemaFields
	unique: SchemaUniqueConstraint
}
