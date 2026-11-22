import { escapeValue, isPgLiteral } from '@contember/database-migrations'
import { JSONValue, Model } from '@contember/schema'
import { wrapIdentifier } from '../../utils/dbHelpers.js'

export const getColumnSqlType = (column: Pick<Model.AnyColumn, 'type' | 'columnType' | 'list'>) =>
	(column.type === Model.ColumnType.Enum
		? wrapIdentifier(column.columnType)
		: column.columnType)
	+ (column.list ? '[]' : '')

const jsonSqlTypes = new Set(['json', 'jsonb'])

/**
 * SQL for a fill value or column default of a column of the given SQL type.
 * An object or array for a json/jsonb column is JSON data, not a PostgreSQL array, so it becomes a JSON literal.
 */
export const formatColumnValue = (value: JSONValue, columnSqlType: string): string => {
	if (jsonSqlTypes.has(columnSqlType.toLowerCase()) && typeof value === 'object' && value !== null && !isPgLiteral(value)) {
		return `${escapeValue(JSON.stringify(value))}::${columnSqlType}`
	}
	return escapeValue(value).toString()
}
