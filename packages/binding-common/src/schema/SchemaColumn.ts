import type { FieldName } from '../treeParameters/index.js'
import type { SchemaColumnType } from './SchemaColumnType.js'
import type { SchemaEnumName } from './SchemaEnums.js'

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
