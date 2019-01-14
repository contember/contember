import * as Knex from 'knex'
import KnexWrapper from './KnexWrapper'
import { Value } from './types'
import WindowFunction from './WindowFunction'
import ConditionBuilder from './ConditionBuilder'
import CaseStatement from './CaseStatement'

namespace QueryBuilder {
	type ColumnFqn = string
	type TableAliasAndColumn = [string, string]
	export type ColumnIdentifier = ColumnFqn | TableAliasAndColumn

	export type ConditionCallback = (whereClause: ConditionBuilder) => void
	export type ColumnExpression =
		| Knex.Raw
		| ((expressionFactory: QueryBuilder.ColumnExpressionFactory) => Knex.Raw | undefined)
	export type ColumnExpressionMap = { [columnName: string]: QueryBuilder.ColumnExpression }

	export function toFqn(columnName: ColumnIdentifier): string {
		if (typeof columnName === 'string') {
			return columnName
		}
		return `${columnName[0]}.${columnName[1]}`
	}

	export function columnExpressionToRaw(
		wrapper: KnexWrapper,
		expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression
	): Knex.Raw | undefined {
		if (typeof expr === 'function') {
			return expr(new QueryBuilder.ColumnExpressionFactory(wrapper))
		} else if (typeof expr === 'string' || Array.isArray(expr)) {
			return wrapper.raw('??', QueryBuilder.toFqn(expr))
		}
		return expr
	}

	export interface Orderable<R> {
		orderBy(columnName: QueryBuilder.ColumnIdentifier, direction?: 'asc' | 'desc'): R
	}

	export class ColumnExpressionFactory {
		constructor(private readonly wrapper: KnexWrapper) {}

		public select(columnName: QueryBuilder.ColumnIdentifier): Knex.Raw {
			const columnFqn = QueryBuilder.toFqn(columnName)
			return this.wrapper.raw('??', columnFqn)
		}

		public selectValue(value: Value, type?: string): Knex.Raw {
			const sql = '?' + (type ? ` :: ${type}` : '')
			return this.wrapper.raw(sql, value)
		}

		public selectCondition(condition: ConditionCallback): Knex.Raw | undefined {
			const builder = new ConditionBuilder.ConditionStringBuilder(this.wrapper)
			condition(builder)
			return builder.getSql() || undefined
		}

		public raw(sql: string, ...bindings: (Value | Knex.QueryBuilder)[]): Knex.Raw {
			return this.wrapper.raw(sql, ...bindings)
		}

		public window(callback: (windowFunction: WindowFunction<false>) => WindowFunction<true>): Knex.Raw {
			return callback(WindowFunction.createEmpty(this.wrapper)).buildRaw()
		}

		public case(callback: (caseStatement: CaseStatement) => CaseStatement): Knex.Raw {
			return callback(CaseStatement.createEmpty(this.wrapper)).createExpression()
		}
	}
}

export default QueryBuilder
