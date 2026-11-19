import { Model } from '@contember/schema'
import { wrapIdentifier } from '../../utils/dbHelpers.js'

export const getColumnSqlType = (column: Pick<Model.AnyColumn, 'type' | 'columnType' | 'list'>) =>
	(column.type === Model.ColumnType.Enum
		? wrapIdentifier(column.columnType)
		: column.columnType)
	+ (column.list ? '[]' : '')
