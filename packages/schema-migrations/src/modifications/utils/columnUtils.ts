import { escapeValue, isPgLiteral } from '@contember/database-migrations'
import { JSONValue, Model } from '@contember/schema'
import { wrapIdentifier } from '../../utils/dbHelpers.js'

export const getColumnSqlType = (column: Pick<Model.AnyColumn, 'type' | 'columnType' | 'list'>) =>
	(column.type === Model.ColumnType.Enum
		? wrapIdentifier(column.columnType)
		: column.columnType)
	+ (column.list ? '[]' : '')

type ColumnTypeInfo = Pick<Model.AnyColumn, 'type' | 'columnType' | 'list'>

/**
 * SQL for a fill value or column default of the given column.
 * A JSON column takes JSON data: an object, array, number or boolean becomes a JSON literal, not a PostgreSQL array or a bare scalar.
 */
export const formatColumnValue = (value: JSONValue, column: ColumnTypeInfo): string => {
	if (column.type !== Model.ColumnType.Json || value === null || isPgLiteral(value)) {
		return escapeValue(value).toString()
	}
	if (column.list && Array.isArray(value)) {
		return `ARRAY[${value.map(it => formatJsonElement(it, column.columnType)).join(',')}]::${getColumnSqlType(column)}`
	}
	// PostgreSQL has always read a string here as JSON text; it stays uncast so its SQL does not change.
	if (typeof value === 'string') {
		return escapeValue(value).toString()
	}
	return formatJsonElement(value, column.columnType)
}

const formatJsonElement = (value: JSONValue, jsonSqlType: string): string => {
	if (value === null || isPgLiteral(value)) {
		return escapeValue(value).toString()
	}
	return `${escapeValue(typeof value === 'string' ? value : JSON.stringify(value))}::${jsonSqlType}`
}
