import * as Knex from 'knex'
import { Formatter, Value } from './types'
import QueryBuilder from './QueryBuilder'

type ConditionBuilderCallback = (builder: ConditionBuilder) => void

interface ConditionBuilder {
	isEmpty(): boolean

	and(callback: ConditionBuilderCallback): void

	or(callback: ConditionBuilderCallback): void

	not(callback: ConditionBuilderCallback): void

	in(columnName: QueryBuilder.ColumnIdentifier, values: Value[]): void

	in(columnName: QueryBuilder.ColumnIdentifier, callback: QueryBuilder.Callback): void

	null(columnName: QueryBuilder.ColumnIdentifier): void

	compare(columnName: QueryBuilder.ColumnIdentifier, operator: ConditionBuilder.Operator, value: Value): void

	compareColumns(
		columnName1: QueryBuilder.ColumnIdentifier,
		operator: ConditionBuilder.Operator,
		columnName2: QueryBuilder.ColumnIdentifier
	): void

	raw(sql: string, ...bindings: (Value | Knex.QueryBuilder)[]): void
}

namespace ConditionBuilder {
	export type Operator = '!=' | '=' | '<=' | '>=' | '<' | '>'

	export class ConditionStringBuilder implements ConditionBuilder {
		public readonly expressions: string[] = []
		public readonly formatter: Formatter

		constructor(private readonly qb: QueryBuilder<any>) {
			this.formatter = qb.formatter()
		}

		and(callback: ConditionBuilderCallback): void {
			this.invokeCallback(callback, ['and', false])
		}

		or(callback: ConditionBuilderCallback): void {
			this.invokeCallback(callback, ['or', false])
		}

		not(callback: ConditionBuilderCallback): void {
			this.invokeCallback(callback, ['and', true])
		}

		private invokeCallback(callback: ConditionBuilderCallback, parameters: ['and' | 'or', boolean]) {
			const builder = new ConditionStringBuilder(this.qb)
			callback(builder)
			const sql = builder.getSql(...parameters)
			if (sql) {
				this.expressions.push(this.formatter.wrap(sql))
			}
		}

		compare(columnName: QueryBuilder.ColumnIdentifier, operator: Operator, value: Value): void {
			const columnNameWrapped = this.wrapColumnName(columnName)
			this.expressions.push(
				`${columnNameWrapped} ${this.formatter.operator(operator)} ${this.formatter.parameter(value)}`
			)
		}

		compareColumns(
			columnName1: QueryBuilder.ColumnIdentifier,
			operator: Operator,
			columnName2: QueryBuilder.ColumnIdentifier
		) {
			this.expressions.push(
				`${this.wrapColumnName(columnName1)} ${this.formatter.operator(operator)} ${this.wrapColumnName(columnName2)}`
			)
		}

		in(columnName: QueryBuilder.ColumnIdentifier, values: Value[] | QueryBuilder.Callback): void {
			if (typeof values === 'function') {
				const qb = this.qb.wrapper.queryBuilder()
				values(qb)
				this.expressions.push(`${this.wrapColumnName(columnName)} in (${this.formatter.wrap(qb.getSql())})`)
			} else {
				this.expressions.push(`${this.wrapColumnName(columnName)} in ${this.formatter.values(values)}`)
			}
		}

		null(columnName: QueryBuilder.ColumnIdentifier): void {
			const columnNameWrapped = this.wrapColumnName(columnName)
			this.expressions.push(`${columnNameWrapped} is null`)
		}

		raw(sql: string, ...bindings: (Value | Knex.QueryBuilder)[]): void {
			const raw = this.qb.raw(sql, ...bindings)
			this.expressions.push(this.formatter.wrap(raw))
		}

		public getSql(operator: 'or' | 'and' = 'and', not: boolean = false): Knex.Raw | null {
			if (this.expressions.length === 0) {
				return null
			}
			const sql = this.expressions.join(` ${operator} `)

			return this.qb.raw(not ? `not(${sql})` : operator === 'or' ? `(${sql})` : sql, ...this.formatter.bindings)
		}

		isEmpty(): boolean {
			return this.expressions.length === 0
		}

		private wrapColumnName(columnName: QueryBuilder.ColumnIdentifier): string {
			return this.formatter.wrapString(QueryBuilder.toFqn(columnName))
		}
	}
}

export default ConditionBuilder
