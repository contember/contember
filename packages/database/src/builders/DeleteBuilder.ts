import { Returning } from './internal/Returning'
import { With } from './internal/With'
import { Where } from './internal/Where'
import { Compiler } from './Compiler'
import { QueryBuilder } from './QueryBuilder'
import { Client, Connection } from '../client'
import { Literal } from '../Literal'
import { createSubQueryLiteralFactory, SubQueryExpression } from './internal/Subqueries'

class DeleteBuilder<Result extends DeleteBuilder.DeleteResult> implements Returning.Aware, With.Aware, Where.Aware, QueryBuilder {

	private constructor(private readonly options: DeleteBuilder.Options) {}

	public static create(): DeleteBuilder<DeleteBuilder.AffectedRows> {
		return new DeleteBuilder({
			from: undefined,
			with: new With.Statement({}),
			returning: new Returning(),
			using: {},
			where: new Where.Statement([]),
		})
	}

	with(alias: string, expression: SubQueryExpression): DeleteBuilder<Result> {
		return this.withOption('with', this.options.with.withCte(alias, createSubQueryLiteralFactory(expression)))
	}

	public from(tableName: string): DeleteBuilder<Result> {
		return this.withOption('from', tableName)
	}

	public where(where: Where.Expression): DeleteBuilder<Result> {
		return this.withOption('where', this.options.where.withWhere(where))
	}

	public using(tableName: string, alias?: string): DeleteBuilder<Result> {
		return this.withOption('using', { ...this.options.using, [alias || tableName]: tableName })
	}

	public returning<R extends Returning.Result = Returning.Result>(...columns: Returning.ReturningColumn[]): DeleteBuilder<R[]> {
		return this.withOption('returning', new Returning(columns)) as DeleteBuilder<any>
	}

	public createQuery(context: Compiler.Context): Literal {
		const compiler = new Compiler()
		return compiler.compileDelete(this.options, context)
	}

	public async execute(db: Client): Promise<Result> {
		const context = new Compiler.Context(db.schema, new Set())
		const query = this.createQuery(context)
		const result: Connection.Result = await db.query(query.sql, query.parameters)
		return this.options.returning.parseResponse<Result>(result)
	}

	protected withOption<K extends keyof DeleteBuilder.Options, V extends DeleteBuilder.Options[K]>(
		key: K,
		value: V,
	): DeleteBuilder<Result> {
		return new DeleteBuilder<Result>({
			...this.options,
			[key]: value,
		}) as DeleteBuilder<Result>
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
}

export { DeleteBuilder }
