import type { FieldName } from '../treeParameters'
import type { SchemaColumnType } from './SchemaColumnType'
import type { SchemaEnumName } from './SchemaEnums'

export interface SchemaColumn {
	__typename: '_Column'
	defaultValue: any
	name: FieldName
	nullable: boolean
	type: SchemaColumnType
	enumName: SchemaEnumName | null
	deprecationReason: string | null
	description: string | null

	// rules
	// validators
}
