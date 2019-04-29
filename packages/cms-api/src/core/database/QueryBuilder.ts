import Client from './Client'
import { Value } from './types'
import WindowFunction from './WindowFunction'
import ConditionBuilder from './ConditionBuilder'
import CaseStatement from './CaseStatement'
import { wrapIdentifier } from './utils'
import Literal from './Literal'

interface QueryBuilder {
	createQuery(): Literal
}

namespace QueryBuilder {
	type ColumnFqn = string
	type TableAliasAndColumn = [string, string]
	export type ColumnIdentifier = ColumnFqn | TableAliasAndColumn

	export type Values = { [columnName: string]: QueryBuilder.ColumnExpression | Value }
	export type ResolvedValues = { [columnName: string]: Literal }

	export type ConditionCallback = (whereClause: ConditionBuilder) => void
	export type ColumnExpression =
		| Literal
		| ((expressionFactory: QueryBuilder.ColumnExpressionFactory) => Literal | undefined)
	export type ColumnExpressionMap = { [columnName: string]: QueryBuilder.ColumnExpression }

	export function resolveValues(values: Values): ResolvedValues {
		return Object.entries(values)
			.map(
				([key, value]): [string, Literal | Value | undefined] => {
					if (typeof value === 'function') {
						return [key, value(new QueryBuilder.ColumnExpressionFactory())]
					} else if (value instanceof Literal) {
						return [key, value]
					}
					return [key, new Literal('?', [value])]
				}
			)
			.filter((it): it is [string, Literal] => it[1] !== undefined)
			.reduce((result, [key, value]) => ({ ...result, [key]: value }), {})
	}

	export function toFqn(columnName: ColumnIdentifier): string {
		if (typeof columnName === 'string') {
			return columnName
		}
		return `${columnName[0]}.${columnName[1]}`
	}

	export function toFqnWrap(columnName: ColumnIdentifier): string {
		if (typeof columnName === 'string') {
			return columnName === '*' ? '*' : wrapIdentifier(columnName)
		}
		const columnExpr = columnName[1] === '*' ? '*' : wrapIdentifier(columnName[1])
		return `${wrapIdentifier(columnName[0])}.${columnExpr}`
	}

	export function columnExpressionToLiteral(
		expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression
	): Literal | undefined {
		if (typeof expr === 'function') {
			return expr(new QueryBuilder.ColumnExpressionFactory())
		} else if (typeof expr === 'string' || Array.isArray(expr)) {
			return new Literal(QueryBuilder.toFqnWrap(expr))
		}
		return expr
	}

	export interface Orderable<R> {
		orderBy(columnName: QueryBuilder.ColumnIdentifier, direction?: 'asc' | 'desc'): R
	}

	export class ColumnExpressionFactory {
		constructor() {}

		public select(columnName: QueryBuilder.ColumnIdentifier): Literal {
			return new Literal(QueryBuilder.toFqnWrap(columnName))
		}

		public selectValue(value: Value, type?: string): Literal {
			const sql = '?' + (type ? ` :: ${type}` : '')
			return new Literal(sql, [value])
		}

		public selectCondition(condition: ConditionCallback): Literal | undefined {
			const builder = new ConditionBuilder()
			condition(builder)
			return builder.getSql() || undefined
		}

		public raw(sql: string, ...bindings: Value[]): Literal {
			return new Literal(sql, bindings)
		}

		public window(callback: (windowFunction: WindowFunction<false>) => WindowFunction<true>): Literal {
			return callback(WindowFunction.createEmpty()).compile()
		}

		public case(callback: (caseStatement: CaseStatement) => CaseStatement): Literal {
			return callback(CaseStatement.createEmpty()).compile()
		}
	}
}

export default QueryBuilder
