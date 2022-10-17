import { Returning } from './internal/Returning'
import { With } from './internal/With'
import { Where } from './internal/Where'
import { Compiler } from './Compiler'
import { QueryBuilder } from './QueryBuilder'
import { Client, Connection } from '../client'
import { Literal } from '../Literal'
import { SelectBuilder } from './SelectBuilder'
import { resolveValues } from './utils'
import { createSubQueryLiteralFactory, SubQueryExpression } from './internal/Subqueries'

class UpdateBuilder<Result extends UpdateBuilder.UpdateResult> implements With.Aware, Where.Aware, QueryBuilder {
	private constructor(private readonly options: UpdateBuilder.Options) {}

	public static create(): UpdateBuilder<UpdateBuilder.AffectedRows> {
		return new UpdateBuilder({
			table: undefined,
			with: new With.Statement({}),
			values: undefined,
			returning: new Returning(),
			from: undefined,
			where: new Where.Statement([]),
		})
	}

	public with(alias: string, expression: SubQueryExpression): UpdateBuilder<Result> {
		return this.withOption('with', this.options.with.withCte(alias, createSubQueryLiteralFactory(expression)))
	}

	public table(name: string): UpdateBuilder<Result> {
		return this.withOption('table', name)
	}

	public values<Values extends QueryBuilder.Values>(columns: { [K in keyof Values]?: Values[K] | QueryBuilder.ColumnExpression }): UpdateBuilder<Result> {
		return this.withOption('values', resolveValues(columns))
	}

	public returning<R extends Returning.Result = Returning.Result>(...columns: Returning.ReturningColumn[]): UpdateBuilder<R[]> {
		return this.withOption('returning', new Returning(columns)) as UpdateBuilder<any>
	}

	public from(from: SelectBuilder.Callback): UpdateBuilder<Result> {
		return this.withOption('from', from)
	}

	public where(where: Where.Expression): UpdateBuilder<Result> {
		return this.withOption('where', this.options.where.withWhere(where))
	}

	public createQuery(context: Compiler.Context): Literal {
		const values = this.options.values
		const table = this.options.table

		if (table === undefined || values === undefined) {
			throw Error()
		}

		let from: Literal | undefined
		let where = this.options.where

		if (this.options.from !== undefined) {
			let fromQb: SelectBuilder<SelectBuilder.Result> = SelectBuilder.create()
			fromQb = this.options.from(fromQb)
			fromQb = this.options.where.values.reduce((builder, value) => builder.where(value), fromQb)
			const selectSql = fromQb.createQuery(context.withAlias(...this.options.with.getAliases()))
			if (!selectSql.sql.startsWith('select *')) {
				throw new Error(`Query does not start with "select *": ${selectSql.sql}`)
			}
			from = new Literal(selectSql.sql.substring('select *'.length), selectSql.parameters)
			where = new Where.Statement([])
		}

		const compiler = new Compiler()
		return compiler.compileUpdate({ ...this.options, values, table, from, where }, context)
	}

	public async execute(db: Client): Promise<Result> {
		const namespaceContext = new Compiler.Context(db.schema, new Set())
		const query = this.createQuery(namespaceContext)
		const result: Connection.Result = await db.query(query.sql, query.parameters)
		return this.options.returning.parseResponse<Result>(result)
	}

	protected withOption<K extends keyof UpdateBuilder.Options, V extends UpdateBuilder.Options[K]>(
		key: K,
		value: V,
	): UpdateBuilder<Result> {
		return new UpdateBuilder<Result>({
			...this.options,
			[key]: value,
		})
	}
}

namespace UpdateBuilder {
	export type AffectedRows = number
	export type UpdateResult = AffectedRows | Returning.Result[]

	export type Options =
		& {
			table: string | undefined
			values: QueryBuilder.ResolvedValues | undefined
			returning: Returning
			from: SelectBuilder.Callback | undefined
		}
		& With.Options
		& Where.Options

	export type ResolvedOptions = Pick<Options, Exclude<keyof Options, 'from'>> & {
		from: Literal | undefined
		table: Exclude<Options['table'], undefined>
		values: Exclude<Options['values'], undefined>
	}
}

export { UpdateBuilder }
