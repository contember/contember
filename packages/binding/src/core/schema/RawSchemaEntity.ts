import { EntityName } from '../../treeParameters'
import { SchemaColumn } from './SchemaColumn'
import { SchemaRelation } from './SchemaRelation'
import { SchemaUniqueConstraint } from './SchemaUniqueConstraint'

export type RawSchemaFields = Array<SchemaRelation | SchemaColumn>

export interface RawSchemaEntity {
	name: EntityName
	customPrimaryAllowed: boolean
	fields: RawSchemaFields
	unique: SchemaUniqueConstraint
}
