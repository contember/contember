import { QueryBuilder } from './QueryBuilder.js'
import { wrapIdentifier } from '../utils/index.js'

export function toFqn(columnName: QueryBuilder.ColumnIdentifier): string {
	if (typeof columnName === 'string') {
		return columnName
	}
	return `${columnName[0]}.${columnName[1]}`
}

export function toFqnWrap(columnName: QueryBuilder.ColumnIdentifier): string {
	if (typeof columnName === 'string') {
		return columnName === '*' ? '*' : wrapIdentifier(columnName)
	}
	const columnExpr = columnName[1] === '*' ? '*' : wrapIdentifier(columnName[1])
	return `${wrapIdentifier(columnName[0])}.${columnExpr}`
}
