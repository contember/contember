import QueryBuilder from './QueryBuilder'
import KnexWrapper from './KnexWrapper'
import * as Knex from 'knex'
import { QueryResult } from 'pg'
import { Value } from './types'
import ConditionBuilder from './ConditionBuilder'
import Returning from './internal/Returning'

class UpdateBuilder<Result extends UpdateBuilder.UpdateResult, Filled extends keyof UpdateBuilder<Result, never>> {
	private constructor(
		private readonly wrapper: KnexWrapper,
		private readonly options: UpdateBuilder.Options,
		private readonly schema: string
	) {}

	public static create(wrapper: KnexWrapper, schema: string): UpdateBuilder.NewUpdateBuilder {
		return new UpdateBuilder(
			wrapper,
			{
				tableName: undefined,
				cte: {},
				columns: undefined,
				returningColumn: new Returning(),
				updateFrom: undefined,
				wheres: [],
			},
			schema
		) as UpdateBuilder.UpdateBuilderState<UpdateBuilder.AffectedRows, never>
	}

	public with(alias: string, callback: QueryBuilder.Callback): UpdateBuilder.UpdateBuilderState<Result, Filled> {
		return new UpdateBuilder<Result, Filled>(
			this.wrapper,
			{ ...this.options, cte: { ...this.options.cte, [alias]: callback } },
			this.schema
		) as UpdateBuilder.UpdateBuilderState<Result, Filled>
	}

	public table(name: string): UpdateBuilder.UpdateBuilderState<Result, Filled | 'table'> {
		return new UpdateBuilder<Result, Filled | 'table'>(
			this.wrapper,
			{ ...this.options, tableName: name },
			this.schema
		) as UpdateBuilder.UpdateBuilderState<Result, Filled | 'table'>
	}

	public values(columns: UpdateBuilder.Values): UpdateBuilder.UpdateBuilderState<Result, Filled | 'values'> {
		return new UpdateBuilder<Result, Filled | 'values'>(
			this.wrapper,
			{ ...this.options, columns },
			this.schema
		) as UpdateBuilder.UpdateBuilderState<Result, Filled | 'values'>
	}

	public returning(column: string | Knex.Raw): UpdateBuilder.UpdateBuilderState<Returning.Result[], Filled> {
		return new UpdateBuilder<Returning.Result[], Filled>(
			this.wrapper,
			{ ...this.options, returningColumn: new Returning(column) },
			this.schema
		) as UpdateBuilder.UpdateBuilderState<Returning.Result[], Filled>
	}

	public from(from: QueryBuilder.Callback): UpdateBuilder.UpdateBuilderState<Result, Filled> {
		return new UpdateBuilder<Result, Filled>(
			this.wrapper,
			{ ...this.options, updateFrom: from },
			this.schema
		) as UpdateBuilder.UpdateBuilderState<Result, Filled>
	}

	public where(where: { [columName: string]: Value }): UpdateBuilder.UpdateBuilderState<Result, Filled>
	public where(whereCondition: UpdateBuilder.ConditionCallback): UpdateBuilder.UpdateBuilderState<Result, Filled>
	public where(
		where: (UpdateBuilder.ConditionCallback) | { [columName: string]: Value }
	): UpdateBuilder.UpdateBuilderState<Result, Filled> {
		const newWheres = [...this.options.wheres]
		if (typeof where === 'function') {
			const builder = new ConditionBuilder.ConditionStringBuilder(this.wrapper)
			where(builder)
			const sql = builder.getSql()
			if (sql) {
				newWheres.push(sql)
			}
		} else {
			newWheres.push(where)
		}
		return new UpdateBuilder<Result, Filled>(
			this.wrapper,
			{ ...this.options, wheres: newWheres },
			this.schema
		) as UpdateBuilder.UpdateBuilderState<Result, Filled>
	}

	public createQuery(): Knex.Raw {
		const columns = this.options.columns
		const table = this.options.tableName

		if (table === undefined || columns === undefined) {
			throw Error()
		}

		const qb = this.wrapper.knex.queryBuilder()
		Object.entries(this.options.cte).forEach(([alias, cb]) =>
			qb.with(alias, qb => cb(new QueryBuilder(this.wrapper, qb, this.schema)))
		)

		let sql: string
		let bindings: Value[]

		const updateFrom = this.options.updateFrom
		if (updateFrom !== undefined) {
			qb.table(this.wrapper.raw('??.??', this.schema, table))

			const fromQb = new QueryBuilder(
				this.wrapper,
				this.wrapper.knex.queryBuilder(),
				this.schema,
				Object.keys(this.options.cte)
			)
			updateFrom(fromQb)
			this.options.wheres.forEach(it => fromQb.where(it))
			const selectSql = fromQb.qb.toSQL()
			if (!selectSql.sql.startsWith('select *')) {
				throw new Error()
			}
			const values = this.getColumnValues(columns)
			qb.update(values)
			const updateSql = qb.toSQL()
			sql = updateSql.sql + ' ' + selectSql.sql.substring('select *'.length)
			bindings = [...updateSql.bindings, ...selectSql.bindings]
		} else {
			qb.table(this.wrapper.raw('??.??', this.schema, table))
			qb.update(this.getColumnValues(columns))
			this.options.wheres.forEach(it => qb.where(it))
			sql = qb.toSQL().sql
			bindings = qb.toSQL().bindings
		}

		const [sqlWithReturning, bindingsWithReturning] = this.options.returningColumn.modifyQuery(sql, bindings)

		return this.wrapper.raw(sqlWithReturning, ...bindingsWithReturning)
	}

	public async execute(): Promise<Result> {
		const result: QueryResult = await this.createQuery()
		return this.options.returningColumn.parseResponse<Result>(result)
	}

	private getColumnValues(values: UpdateBuilder.Values): { [column: string]: Knex.Raw } {
		return Object.entries(values)
			.map(
				([key, value]): [string, Knex.Raw | Value | undefined] => {
					if (typeof value === 'function') {
						return [key, value(new QueryBuilder.ColumnExpressionFactory(this.wrapper))]
					}
					return [key, value]
				}
			)
			.filter((it): it is [string, Knex.Raw] => it[1] !== undefined)
			.reduce((result, [key, value]) => ({ ...result, [key]: value }), {})
	}
}

namespace UpdateBuilder {
	export type AffectedRows = number
	export type UpdateResult = AffectedRows | Returning.Result[]
	export type ConditionCallback = (whereClause: ConditionBuilder) => void

	export interface Options {
		tableName: string | undefined
		cte: { [alias: string]: QueryBuilder.Callback }
		columns: UpdateBuilder.Values | undefined
		returningColumn:Returning
		updateFrom: QueryBuilder.Callback | undefined
		wheres: (Knex.Raw | { [columName: string]: Value })[]
	}

	export type UpdateBuilderWithoutExecute<
		Result extends UpdateResult,
		Filled extends keyof UpdateBuilder<Result, Filled>
	> = Pick<UpdateBuilder<Result, Filled>, Exclude<keyof UpdateBuilder<Result, Filled>, 'execute' | 'createQuery'>>

	export type UpdateBuilderState<Result extends UpdateResult, Filled extends keyof UpdateBuilder<Result, Filled>> =
		| 'table'
		| 'values' extends Filled
		? UpdateBuilder<Result, Filled>
		: UpdateBuilderWithoutExecute<Result, Filled>

	export type NewUpdateBuilder = UpdateBuilder.UpdateBuilderState<UpdateBuilder.AffectedRows, never>

	export type Values = { [columnName: string]: QueryBuilder.ColumnExpression | Value }
}

export default UpdateBuilder
