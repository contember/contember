import { Returning } from './internal/Returning'
import { With } from './internal/With'
import { Compiler } from './Compiler'
import { QueryBuilder } from './QueryBuilder'
import { Client, Connection } from '../client'
import { Literal } from '../Literal'
import { SelectBuilder } from './SelectBuilder'
import { resolveValues } from './utils'
import { ConflictActionType } from './ConflictActionType'
import { createSubQueryLiteralFactory, SubQueryExpression } from './internal/Subqueries'

class InsertBuilder<Result extends InsertBuilder.InsertResult, Filled extends keyof InsertBuilder<Result, never>>
	implements With.Aware, QueryBuilder {
	private constructor(private readonly options: InsertBuilder.Options) {}

	public static create(): InsertBuilder.NewInsertBuilder {
		return new InsertBuilder({
			into: undefined,
			with: new With.Statement({}),
			values: undefined,
			onConflict: undefined,
			returning: new Returning(),
			from: undefined,
		}) as InsertBuilder.InsertBuilderState<InsertBuilder.AffectedRows, never>
	}

	public with(
		alias: string,
		expression: SubQueryExpression,
	): InsertBuilder.InsertBuilderState<Result, Filled | 'with'> {
		return this.withOption('with', this.options.with.withCte(alias, createSubQueryLiteralFactory(expression)))
	}

	public into(intoTable: string): InsertBuilder.InsertBuilderState<Result, Filled | 'into'> {
		return this.withOption('into', intoTable)
	}

	public values(columns: QueryBuilder.Values): InsertBuilder.InsertBuilderState<Result, Filled | 'values'> {
		return this.withOption('values', resolveValues(columns))
	}

	public onConflict(
		type: ConflictActionType.update,
		target: InsertBuilder.ConflictTarget,
		values: QueryBuilder.Values,
	): InsertBuilder.InsertBuilderState<Result, Filled | 'onConflict'>
	public onConflict(
		type: ConflictActionType.doNothing,
		target?: InsertBuilder.ConflictTarget,
	): InsertBuilder.InsertBuilderState<Result, Filled | 'onConflict'>
	public onConflict(
		type: ConflictActionType,
		target?: InsertBuilder.ConflictTarget,
		values?: QueryBuilder.Values,
	): InsertBuilder.InsertBuilderState<Result, Filled | 'onConflict'> {
		let conflictAction: InsertBuilder.ConflictAction
		if (type === ConflictActionType.update && values && target) {
			conflictAction = { type, values: resolveValues(values), target }
		} else if (type === ConflictActionType.doNothing) {
			conflictAction = { type, target }
		} else {
			throw Error()
		}
		return this.withOption('onConflict', conflictAction)
	}

	public returning(
		column: string | Literal,
	): InsertBuilder.InsertBuilderState<Returning.Result[], Filled | 'returning'> {
		return this.withOption('returning', new Returning(column)) as InsertBuilder.InsertBuilderState<
			Returning.Result[],
			Filled | 'returning'
		>
	}

	public from(from: SelectBuilder.Callback): InsertBuilder.InsertBuilderState<Result, Filled | 'from'> {
		return this.withOption('from', from)
	}

	public createQuery(context: Compiler.Context): Literal {
		const values = this.options.values
		const into = this.options.into

		if (into === undefined || values === undefined) {
			throw Error()
		}

		let from: Literal | undefined

		if (this.options.from !== undefined) {
			let queryBuilder: SelectBuilder<SelectBuilder.Result, any> = SelectBuilder.create()
			queryBuilder = Object.values(values).reduce((qb, raw) => qb.select(raw), queryBuilder)
			queryBuilder = this.options.from(queryBuilder)
			from = queryBuilder.createQuery(context.withAlias(...this.options.with.getAliases()))
		}

		const compiler = new Compiler()
		return compiler.compileInsert({ ...this.options, values, into, from }, context)
	}

	public async execute(db: Client): Promise<Result> {
		const namespaceContext = new Compiler.Context(db.schema, new Set())
		const query = this.createQuery(namespaceContext)
		const result: Connection.Result = await db.query(query.sql, query.parameters)
		return this.options.returning.parseResponse<Result>(result)
	}

	private withOption<K extends keyof InsertBuilder.Options, V extends InsertBuilder.Options[K]>(
		key: K,
		value: V,
	): InsertBuilder.InsertBuilderState<Result, Filled | K> {
		return new InsertBuilder<Result, Filled | K>({ ...this.options, [key]: value }) as InsertBuilder.InsertBuilderState<
			Result,
			Filled | K
		>
	}
}

namespace InsertBuilder {
	export type AffectedRows = number
	export type InsertResult = AffectedRows | Returning.Result[]

	export type Options = {
		into: string | undefined
		values: QueryBuilder.ResolvedValues | undefined
		onConflict: ConflictAction | undefined
		returning: Returning
		from: SelectBuilder.Callback | undefined
	} & With.Options

	export type ResolvedOptions = Pick<Options, Exclude<keyof Options, 'from'>> & {
		from: Literal | undefined
		into: Exclude<Options['into'], undefined>
		values: Exclude<Options['values'], undefined>
	}

	export type InsertBuilderWithoutExecute<
		Result extends InsertResult,
		Filled extends keyof InsertBuilder<Result, Filled>
	> = Pick<InsertBuilder<Result, Filled>, Exclude<keyof InsertBuilder<Result, Filled>, 'execute' | 'createQuery'>>

	export type InsertBuilderState<Result extends InsertResult, Filled extends keyof InsertBuilder<Result, Filled>> =
		| 'into'
		| 'values' extends Filled
		? InsertBuilder<Result, Filled>
		: InsertBuilderWithoutExecute<Result, Filled>

	export type NewInsertBuilder = InsertBuilder.InsertBuilderState<InsertBuilder.AffectedRows, never>

	export type ConflictAction =
		| { type: ConflictActionType.doNothing; target?: ConflictTarget }
		| { type: ConflictActionType.update; values: QueryBuilder.ResolvedValues; target: ConflictTarget }

	export type IndexColumns = string[]
	export type ConflictTarget = IndexColumns | { constraint: string }
}

export { InsertBuilder }
