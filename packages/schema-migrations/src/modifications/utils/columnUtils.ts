import { Model } from '@contember/schema'

export const getColumnSqlType = (column: Pick<Model.AnyColumn, 'type' | 'columnType'>) => column.type === Model.ColumnType.Enum
	? `"${column.columnType}"`
	: column.columnType
