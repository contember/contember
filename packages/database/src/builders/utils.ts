import { Literal } from '../Literal.js'
import { QueryBuilder } from './QueryBuilder.js'
import { ColumnExpressionFactory } from './ColumnExpressionFactory.js'
import { formatColumnIdentifier } from '../utils/index.js'

export function resolveValues(values: QueryBuilder.Values): QueryBuilder.ResolvedValues {
	return Object.entries(values)
		.map(([key, value]) => {
			const resolved = typeof value === 'function' ? value(new ColumnExpressionFactory()) : value
			return {
				columnName: key,
				value: resolved === undefined || resolved instanceof Literal ? resolved : new Literal('?', [resolved]),
			}
		})
		.filter((it): it is QueryBuilder.ResolvedValue => it.value !== undefined)
}

export function columnExpressionToLiteral(
	expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression,
): Literal | undefined {
	if (typeof expr === 'function') {
		return expr(new ColumnExpressionFactory())
	} else if (typeof expr === 'string' || Array.isArray(expr)) {
		return new Literal(formatColumnIdentifier(expr))
	}
	return expr
}
