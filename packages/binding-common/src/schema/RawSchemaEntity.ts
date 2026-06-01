import type { EntityName } from '../treeParameters/index.js'
import type { SchemaColumn } from './SchemaColumn.js'
import type { SchemaRelation } from './SchemaRelation.js'

export type RawSchemaFields = Array<SchemaRelation | SchemaColumn>

export interface RawSchemaEntity {
	name: EntityName
	customPrimaryAllowed: boolean
	fields: RawSchemaFields
	unique: { fields: string[] }[]
}
