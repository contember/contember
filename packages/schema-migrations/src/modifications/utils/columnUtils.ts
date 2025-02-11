import { Model } from '@contember/schema'

export const getColumnSqlType = (column: Pick<Model.AnyColumn, 'type' | 'columnType' | 'list'>) =>
	(column.type === Model.ColumnType.Enum
		? `"${column.columnType}"`
		: column.columnType
	)
	+ (column.list ? '[]' : '')
