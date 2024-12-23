import { Value } from '@contember/schema'

export type ColumnValue = {
	value: Value.FieldValue
	fieldName: string
	columnName: string
	columnType: string
}


export const rowDataToFieldValues = (values: ColumnValue[]): Record<string, Value.FieldValue> =>
	Object.fromEntries(values.map(it => [it.fieldName, it.value]))
