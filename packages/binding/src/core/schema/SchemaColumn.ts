import type { FieldName } from '../../treeParameters'
import type { SchemaColumnType } from './SchemaColumnType'
import type { SchemaEnumName } from './SchemaEnums'

export interface SchemaColumn {
	__typename: '_Column'
	defaultValue: string | number | boolean | null // JSON
	name: FieldName
	nullable: boolean
	type: SchemaColumnType
	enumName: SchemaEnumName | null

	// rules
	// validators
}
