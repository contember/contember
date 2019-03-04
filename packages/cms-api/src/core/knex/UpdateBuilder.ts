import QueryBuilder from './QueryBuilder'
import KnexWrapper from './KnexWrapper'
import Knex from 'knex'
import { QueryResult } from 'pg'
import { Value } from './types'
import Returning from './internal/Returning'
import With from './internal/With'
import Where from './internal/Where'
import SelectBuilder from './SelectBuilder'

class UpdateBuilder<Result extends UpdateBuilder.UpdateResult, Filled extends keyof UpdateBuilder<Result, never>>
	implements With.Aware, Where.Aware {
	private constructor(private readonly wrapper: KnexWrapper, private readonly options: UpdateBuilder.Options) {}

	public static create(wrapper: KnexWrapper): UpdateBuilder.NewUpdateBuilder {
		return new UpdateBuilder(wrapper, {
			table: undefined,
			with: new With.Statement(wrapper, {}),
			values: undefined,
			returning: new Returning(),
			from: undefined,
			where: new Where.Statement(wrapper, []),
		}) as UpdateBuilder.UpdateBuilderState<UpdateBuilder.AffectedRows, never>
	}

	public with(alias: string, expression: With.Expression): UpdateBuilder.UpdateBuilderState<Result, Filled | 'with'> {
		return this.withOption('with', this.options.with.withCte(alias, expression))
	}

	public table(name: string): UpdateBuilder.UpdateBuilderState<Result, Filled | 'table'> {
		return this.withOption('table', name)
	}

	public values(columns: UpdateBuilder.Values): UpdateBuilder.UpdateBuilderState<Result, Filled | 'values'> {
		return this.withOption('values', columns)
	}

	public returning(
		column: string | Knex.Raw
	): UpdateBuilder.UpdateBuilderState<Returning.Result[], Filled | 'returning'> {
		return this.withOption('returning', new Returning(column)) as UpdateBuilder.UpdateBuilderState<
			Returning.Result[],
			Filled | 'returning'
		>
	}

	public from(from: SelectBuilder.Callback): UpdateBuilder.UpdateBuilderState<Result, Filled | 'from'> {
		return this.withOption('from', from)
	}

	public where(where: Where.Expression): UpdateBuilder.UpdateBuilderState<Result, Filled | 'where'> {
		return this.withOption('where', this.options.where.withWhere(where))
	}

	public createQuery(): Knex.Raw {
		const columns = this.options.values
		const table = this.options.table

		if (table === undefined || columns === undefined) {
			throw Error()
		}

		const qb = this.wrapper.knex.queryBuilder()
		this.options.with.apply(qb)

		let sql: string
		let bindings: Value[]

		const updateFrom = this.options.from
		if (updateFrom !== undefined) {
			qb.table(this.wrapper.raw('??.??', this.wrapper.schema, table))

			let fromQb: SelectBuilder = SelectBuilder.create(this.wrapper).withCteAliases(this.options.with.getAliases())
			fromQb = updateFrom(fromQb)
			fromQb = this.options.where.apply(fromQb)

			this.options.where.values.forEach(it => fromQb.where(it))
			const selectSql = fromQb.createQuery()
			if (!selectSql.sql.startsWith('select *')) {
				throw new Error()
			}
			const values = this.getColumnValues(columns)
			qb.update(values)
			const updateSql = qb.toSQL()
			sql = updateSql.sql + ' ' + selectSql.sql.substring('select *'.length)
			bindings = [...updateSql.bindings, ...selectSql.bindings]
		} else {
			qb.table(this.wrapper.raw('??.??', this.wrapper.schema, table))
			qb.update(this.getColumnValues(columns))
			this.options.where.apply(qb)
			sql = qb.toSQL().sql
			bindings = qb.toSQL().bindings
		}

		const [sqlWithReturning, bindingsWithReturning] = this.options.returning.modifyQuery(sql, bindings)

		return this.wrapper.raw(sqlWithReturning, ...bindingsWithReturning)
	}

	public async execute(): Promise<Result> {
		const result: QueryResult = await this.createQuery()
		return this.options.returning.parseResponse<Result>(result)
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

	protected withOption<K extends keyof UpdateBuilder.Options, V extends UpdateBuilder.Options[K]>(
		key: K,
		value: V
	): UpdateBuilder.UpdateBuilderState<Result, Filled | K> {
		return new UpdateBuilder<Result, Filled | K>(this.wrapper, {
			...this.options,
			[key]: value,
		}) as UpdateBuilder.UpdateBuilderState<Result, Filled | K>
	}
}

namespace UpdateBuilder {
	export type AffectedRows = number
	export type UpdateResult = AffectedRows | Returning.Result[]

	export type Options = {
		table: string | undefined
		values: UpdateBuilder.Values | undefined
		returning: Returning
		from: SelectBuilder.Callback | undefined
	} & With.Options &
		Where.Options

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
