import type { SchemaEnumName } from './SchemaEnums.js'

export interface RawSchemaEnum {
	name: SchemaEnumName
	values: string[]
}
