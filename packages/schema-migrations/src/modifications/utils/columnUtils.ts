import { Model } from '@contember/schema'

export const getColumnSqlType = (column: Model.AnyColumn) => column.type === Model.ColumnType.Enum
	? `"${column.columnType}"`
	: column.columnType
