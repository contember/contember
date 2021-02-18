import { FieldName } from '../../treeParameters'
import { SchemaColumnType } from './SchemaColumnType'
import { SchemaEnumName } from './SchemaEnums'

export interface SchemaColumn {
	__typename: '_Column'
	defaultValue: string | null // JSON
	name: FieldName
	nullable: boolean
	type: SchemaColumnType
	enumName: SchemaEnumName | null

	// rules
	// validators
}
