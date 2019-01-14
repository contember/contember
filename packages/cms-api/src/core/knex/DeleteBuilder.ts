import KnexWrapper from './KnexWrapper'
import * as Knex from 'knex'
import { QueryResult } from 'pg'
import Returning from './internal/Returning'
import With from './internal/With'
import QueryBuilder from './QueryBuilder'
import Where from './internal/Where'
import { Raw } from './types'

class DeleteBuilder<Result extends DeleteBuilder.DeleteResult, Filled extends keyof DeleteBuilder<Result, never>>
	implements Returning.Aware, With.Aware, Where.Aware {
	private constructor(private readonly wrapper: KnexWrapper, private readonly options: DeleteBuilder.Options) {}

	public static create(wrapper: KnexWrapper): DeleteBuilder.NewDeleteBuilder {
		return new DeleteBuilder(wrapper, {
			from: undefined,
			with: new With.Statement(wrapper, {}),
			returning: new Returning(),
			using: {},
			where: new Where.Statement(wrapper, []),
		}) as DeleteBuilder.DeleteBuilderState<DeleteBuilder.AffectedRows, never>
	}

	with(alias: string, expression: With.Expression): DeleteBuilder.DeleteBuilderState<Result, Filled | 'with'> {
		return this.withOption('with', this.options.with.withCte(alias, expression))
	}

	public from(tableName: string): DeleteBuilder.DeleteBuilderState<Result, Filled | 'from'> {
		return this.withOption('from', tableName)
	}

	public where(where: Where.Expression): DeleteBuilder.DeleteBuilderState<Result, Filled | 'where'> {
		return this.withOption('where', this.options.where.withWhere(where))
	}

	public using(tableName: string, alias?: string): DeleteBuilder.DeleteBuilderState<Result, Filled | 'using'> {
		return this.withOption('using', { ...this.options.using, [alias || tableName]: tableName })
	}

	public returning(
		column: QueryBuilder.ColumnIdentifier | Knex.Raw
	): DeleteBuilder.DeleteBuilderState<Returning.Result[], Filled | 'returning'> {
		return this.withOption('returning', new Returning(column)) as DeleteBuilder.DeleteBuilderState<
			Returning.Result[],
			Filled | 'returning'
		>
	}

	public createQuery(): Raw {
		const fromTable = this.options.from

		if (fromTable === undefined) {
			throw Error()
		}

		const qb = this.wrapper.knex.queryBuilder()
		this.options.with.apply(qb)

		const usingBindings: any = []
		Object.entries(this.options.using).forEach(([alias, table]) => usingBindings.push(alias, table))
		const using = Object.keys(this.options.using)
			.map(() => '?? as ??')
			.join(', ')

		qb.from(
			this.wrapper.raw('??.??' + (using ? ' using ' + using : ''), this.wrapper.schema, fromTable, ...usingBindings)
		)

		this.options.where.apply(qb)

		qb.delete()

		const qbSql = qb.toSQL()
		const sql: string = qbSql.sql
		const bindings = qbSql.bindings

		const [sqlWithReturning, bindingsWithReturning] = this.options.returning.modifyQuery(sql, bindings)

		return this.wrapper.raw(sqlWithReturning, ...bindingsWithReturning)
	}

	public async execute(): Promise<Result> {
		const result: QueryResult = await this.createQuery()
		return this.options.returning.parseResponse<Result>(result)
	}

	protected withOption<K extends keyof DeleteBuilder.Options, V extends DeleteBuilder.Options[K]>(
		key: K,
		value: V
	): DeleteBuilder.DeleteBuilderState<Result, Filled | K> {
		return new DeleteBuilder<Result, Filled | K>(this.wrapper, {
			...this.options,
			[key]: value,
		}) as DeleteBuilder.DeleteBuilderState<Result, Filled | K>
	}
}

namespace DeleteBuilder {
	export type AffectedRows = number
	export type DeleteResult = AffectedRows | Returning.Result[]

	export type Options = {
		from: string | undefined
		returning: Returning
		using: { [alias: string]: string }
	} & With.Options &
		Where.Options

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
