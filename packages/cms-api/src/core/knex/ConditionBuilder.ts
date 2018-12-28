import * as Knex from 'knex'
import { Value } from './types'
import QueryBuilder from './QueryBuilder'
import KnexWrapper from './KnexWrapper'

type ConditionBuilderCallback = (builder: ConditionBuilder) => void

interface Raw {
	sql: string
	bindings: (Value | Knex.QueryBuilder)[]
}

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
	export enum Operator {
		'notEq' = '!=',
		'eq' = '=',
		'gt' = '>',
		'gte' = '>=',
		'lt' = '<',
		'lte' = '<=',
	}

	export class ConditionStringBuilder implements ConditionBuilder {
		public readonly expressions: Knex.Raw[] = []

		constructor(private readonly wrapper: KnexWrapper) {}

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
			const builder = new ConditionStringBuilder(this.wrapper)
			callback(builder)
			const sql = builder.getSql(...parameters)
			if (sql) {
				this.expressions.push(sql)
			}
		}

		compare(columnName: QueryBuilder.ColumnIdentifier, operator: Operator, value: Value): void {
			if (!Object.values(Operator).includes(operator)) {
				throw new Error(`Operator ${operator} is not supported`)
			}
			this.expressions.push(this.wrapper.raw(`?? ${operator} ?`, QueryBuilder.toFqn(columnName), value))
		}

		compareColumns(
			columnName1: QueryBuilder.ColumnIdentifier,
			operator: Operator,
			columnName2: QueryBuilder.ColumnIdentifier
		) {
			if (!Object.values(Operator).includes(operator)) {
				throw new Error(`Operator ${operator} is not supported`)
			}
			this.expressions.push(
				this.wrapper.raw(`?? ${operator} ??`, QueryBuilder.toFqn(columnName1), QueryBuilder.toFqn(columnName2))
			)
		}

		in(columnName: QueryBuilder.ColumnIdentifier, values: Value[] | QueryBuilder.Callback): void {
			if (typeof values === 'function') {
				const qb = this.wrapper.queryBuilder()
				values(qb)
				this.expressions.push(this.wrapper.raw('?? in (?)', QueryBuilder.toFqn(columnName), qb.getSql()))
			} else if (values.length > 0) {
				const parameters = values.map(() => '?').join(', ')
				this.expressions.push(this.wrapper.raw(`?? in (${parameters})`, QueryBuilder.toFqn(columnName), ...values))
			} else {
				this.raw('false')
			}
		}

		null(columnName: QueryBuilder.ColumnIdentifier): void {
			this.expressions.push(this.wrapper.raw('?? is null', QueryBuilder.toFqn(columnName)))
		}

		raw(sql: string, ...bindings: (Value | Knex.QueryBuilder)[]): void {
			this.expressions.push(this.wrapper.raw(sql, ...bindings))
		}

		public getSql(operator: 'or' | 'and' = 'and', not: boolean = false): Knex.Raw | null {
			if (this.expressions.length === 0) {
				return null
			}
			const sql = this.expressions.map(it => ((it as any) as Raw).sql).join(` ${operator} `)

			const bindings: (Value | Knex.QueryBuilder)[] = []
			this.expressions.map(it => ((it as any) as Raw).bindings).forEach(it => bindings.push(...it))

			return this.wrapper.raw(not ? `not(${sql})` : operator === 'or' ? `(${sql})` : sql, ...bindings)
		}

		isEmpty(): boolean {
			return this.expressions.length === 0
		}
	}
}

export default ConditionBuilder
