import { Literal } from '../Literal.js'
import { Value } from '../types.js'
import { QueryBuilder } from './QueryBuilder.js'
import { ColumnExpressionFactory } from './ColumnExpressionFactory.js'
import { toFqnWrap } from './formatUtils.js'

export { toFqnWrap }

export function resolveValues(values: QueryBuilder.Values): QueryBuilder.ResolvedValues {
	return Object.entries(values)
		.map(([key, value]): [string, Literal | Value | undefined] => {
			if (typeof value === 'function') {
				return [key, value(new ColumnExpressionFactory())]
			} else if (value instanceof Literal) {
				return [key, value]
			}
			return [key, new Literal('?', [value])]
		})
		.filter((it): it is [string, Literal] => it[1] !== undefined)
		.reduce((result, [key, value]) => ({ ...result, [key]: value }), {})
}

export function columnExpressionToLiteral(
	expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression,
): Literal | undefined {
	if (typeof expr === 'function') {
		return expr(new ColumnExpressionFactory())
	} else if (typeof expr === 'string' || Array.isArray(expr)) {
		return new Literal(toFqnWrap(expr))
	}
	return expr
}
