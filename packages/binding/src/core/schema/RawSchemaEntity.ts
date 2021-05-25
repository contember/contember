import type { EntityName } from '../../treeParameters'
import type { SchemaColumn } from './SchemaColumn'
import type { SchemaRelation } from './SchemaRelation'
import type { SchemaUniqueConstraint } from './SchemaUniqueConstraint'

export type RawSchemaFields = Array<SchemaRelation | SchemaColumn>

export interface RawSchemaEntity {
	name: EntityName
	customPrimaryAllowed: boolean
	fields: RawSchemaFields
	unique: SchemaUniqueConstraint
}
