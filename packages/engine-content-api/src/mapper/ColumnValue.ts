import { Value } from '@contember/schema'

export type ColumnValue = {
	value: Value.FieldValue
	fieldName: string
	columnName: string
	columnType: string
}


export const rowDataToFieldValues = (values: ColumnValue[]): Record<string, Value.FieldValue> =>
	Object.fromEntries(values.map(it => [it.fieldName, it.value]))

export const normalizeDbValue = (value: Value.FieldValue, type: string): Value.FieldValue => {
	if (value === null) {
		return null
	}
	if ((type === 'jsonb' || type === 'json') && typeof value === 'object') {
		return JSON.stringify(value)
	}
	return value
}
