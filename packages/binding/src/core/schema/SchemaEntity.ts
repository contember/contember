import { EntityName, FieldName } from '../../treeParameters'
import { SchemaColumn } from './SchemaColumn'
import { SchemaRelation } from './SchemaRelation'
import { SchemaUniqueConstraint } from './SchemaUniqueConstraint'

export type SchemaFields = Map<FieldName, SchemaRelation | SchemaColumn>

export interface SchemaEntity {
	name: EntityName
	customPrimaryAllowed: boolean
	fields: SchemaFields
	unique: SchemaUniqueConstraint
}
