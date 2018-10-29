import QueryBuilder from './QueryBuilder'
import KnexWrapper from './KnexWrapper'
import * as Knex from 'knex'
import { QueryResult } from 'pg'
import { Value } from './types'
import ConditionBuilder from './ConditionBuilder'
import Returning from './internal/Returning'

class DeleteBuilder<Result extends DeleteBuilder.DeleteResult, Filled extends keyof DeleteBuilder<Result, never>> implements Returning.Aware {
	private constructor(
		private readonly wrapper: KnexWrapper,
		private readonly options: DeleteBuilder.Options,
		private readonly schema: string
	) {}

	public static create(wrapper: KnexWrapper, schema: string): DeleteBuilder.NewDeleteBuilder {
		return new DeleteBuilder(
			wrapper,
			{
				fromTable: undefined,
				cte: {},
				returningColumn: new Returning(),
				usingTables: {},
				wheres: [],
			},
			schema
		) as DeleteBuilder.DeleteBuilderState<DeleteBuilder.AffectedRows, never>
	}

	public with(alias: string, callback: QueryBuilder.Callback): DeleteBuilder.DeleteBuilderState<Result, Filled> {
		return new DeleteBuilder<Result, Filled>(
			this.wrapper,
			{ ...this.options, cte: { ...this.options.cte, [alias]: callback } },
			this.schema
		) as DeleteBuilder.DeleteBuilderState<Result, Filled>
	}

	public from(tableName: string): DeleteBuilder.DeleteBuilderState<Result, Filled | 'from'> {
		return new DeleteBuilder<Result, Filled | 'from'>(
			this.wrapper,
			{ ...this.options, fromTable: tableName },
			this.schema
		) as DeleteBuilder.DeleteBuilderState<Result, Filled | 'from'>
	}

	public where(where: { [columName: string]: Value }): DeleteBuilder.DeleteBuilderState<Result, Filled>
	public where(whereCondition: DeleteBuilder.ConditionCallback): DeleteBuilder.DeleteBuilderState<Result, Filled>
	public where(
		where: (DeleteBuilder.ConditionCallback) | { [columName: string]: Value }
	): DeleteBuilder.DeleteBuilderState<Result, Filled> {
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
		return new DeleteBuilder<Result, Filled>(
			this.wrapper,
			{ ...this.options, wheres: newWheres },
			this.schema
		) as DeleteBuilder.DeleteBuilderState<Result, Filled>
	}

	public using(tableName: string, alias?: string): DeleteBuilder.DeleteBuilderState<Result, Filled> {
		return new DeleteBuilder<Result, Filled>(
			this.wrapper,
			{ ...this.options, usingTables: { ...this.options.usingTables, [alias || tableName]: tableName } },
			this.schema
		) as DeleteBuilder.DeleteBuilderState<Result, Filled>
	}

	public returning(column: string | Knex.Raw): DeleteBuilder.DeleteBuilderState<Returning.Result[], Filled> {
		return new DeleteBuilder<Returning.Result[], Filled>(
			this.wrapper,
			{ ...this.options, returningColumn: new Returning(column) },
			this.schema
		) as DeleteBuilder.DeleteBuilderState<Returning.Result[], Filled>
	}

	public createQuery(): Knex.Raw {
		const fromTable = this.options.fromTable

		if (fromTable === undefined) {
			throw Error()
		}

		const qb = this.wrapper.knex.queryBuilder()
		Object.entries(this.options.cte).forEach(([alias, cb]) =>
			qb.with(alias, qb => cb(new QueryBuilder(this.wrapper, qb, this.schema)))
		)

		const usingBindings: any = []
		Object.entries(this.options.usingTables).forEach(([alias, table]) => usingBindings.push(alias, table))
		const using = Object.keys(this.options.usingTables)
			.map(() => '?? as ??')
			.join(', ')

		qb.from(this.wrapper.raw('??.??' + (using ? ' using ' + using : ''), this.schema, fromTable, ...usingBindings))

		this.options.wheres.forEach(it => qb.where(it))

		qb.delete()

		const qbSql = qb.toSQL()
		const sql: string = qbSql.sql
		const bindings = qbSql.bindings

		const [sqlWithReturning, bindingsWithReturning] = this.options.returningColumn.modifyQuery(sql, bindings)

		return this.wrapper.raw(sqlWithReturning, ...bindingsWithReturning)
	}

	public async execute(): Promise<Result> {
		const result: QueryResult = await this.createQuery()
		return this.options.returningColumn.parseResponse<Result>(result)
	}
}

namespace DeleteBuilder {
	export type AffectedRows = number
	export type DeleteResult = AffectedRows | Returning.Result[]
	export type ConditionCallback = (whereClause: ConditionBuilder) => void

	export interface Options {
		fromTable: string | undefined
		cte: { [alias: string]: QueryBuilder.Callback }
		returningColumn: Returning,
		usingTables: { [alias: string]: string }
		wheres: (Knex.Raw | { [columName: string]: Value })[]
	}

	export type DeleteBuilderWithoutExecute<
		Result extends DeleteResult,
		Filled extends keyof DeleteBuilder<Result, Filled>
	> = Pick<DeleteBuilder<Result, Filled>, Exclude<keyof DeleteBuilder<Result, Filled>, 'execute' | 'createQuery'>>

	export type DeleteBuilderState<
		Result extends DeleteResult,
		Filled extends keyof DeleteBuilder<Result, Filled>
	> = 'from' extends Filled ? DeleteBuilder<Result, Filled> : DeleteBuilderWithoutExecute<Result, Filled>

	export type NewDeleteBuilder = DeleteBuilder.DeleteBuilderState<DeleteBuilder.AffectedRows, never>
}

export default DeleteBuilder
