import { Literal } from '../Literal'
import { QueryBuilder } from './QueryBuilder'
import { ColumnExpressionFactory } from './ColumnExpressionFactory'
import { toFqnWrap } from './formatUtils'

export { toFqnWrap }

export function resolveValues(values: QueryBuilder.Values): QueryBuilder.ResolvedValues {
	return Object.entries(values)
		.map(([key, value]): [string, Literal | undefined] => {
			if (typeof value === 'function') {
				return [key, value(new ColumnExpressionFactory())]
			} else if (value instanceof Literal) {
				return [key, value]
			}
			if (value === undefined) {
				return [key, undefined]
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
