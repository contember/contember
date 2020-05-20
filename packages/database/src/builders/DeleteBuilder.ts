import { Returning } from './internal/Returning'
import { With } from './internal/With'
import { Where } from './internal/Where'
import { Compiler } from './Compiler'
import { QueryBuilder } from './QueryBuilder'
import { Client, Connection } from '../client'
import { Literal } from '../Literal'
import { createSubQueryLiteralFactory, SubQueryExpression } from './internal/Subqueries'

class DeleteBuilder<Result extends DeleteBuilder.DeleteResult, Filled extends keyof DeleteBuilder<Result, never>>
	implements Returning.Aware, With.Aware, Where.Aware, QueryBuilder {
	private constructor(private readonly options: DeleteBuilder.Options) {}

	public static create(): DeleteBuilder.NewDeleteBuilder {
		return new DeleteBuilder({
			from: undefined,
			with: new With.Statement({}),
			returning: new Returning(),
			using: {},
			where: new Where.Statement([]),
		}) as DeleteBuilder.DeleteBuilderState<DeleteBuilder.AffectedRows, never>
	}

	with(alias: string, expression: SubQueryExpression): DeleteBuilder.DeleteBuilderState<Result, Filled | 'with'> {
		return this.withOption('with', this.options.with.withCte(alias, createSubQueryLiteralFactory(expression)))
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
		column: QueryBuilder.ColumnIdentifier | Literal,
	): DeleteBuilder.DeleteBuilderState<Returning.Result[], Filled | 'returning'> {
		return this.withOption('returning', new Returning(column)) as DeleteBuilder.DeleteBuilderState<
			Returning.Result[],
			Filled | 'returning'
		>
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
	): DeleteBuilder.DeleteBuilderState<Result, Filled | K> {
		return new DeleteBuilder<Result, Filled | K>({
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

export { DeleteBuilder }
