import Client from './Client'
import { QueryResult } from 'pg'
import Returning from './internal/Returning'
import With from './internal/With'
import SelectBuilder from './SelectBuilder'
import QueryBuilder from './QueryBuilder'
import Literal from './Literal'
import Compiler from './Compiler'
import Connection from './Connection'
import { assertNever } from 'cms-common'

class InsertBuilder<Result extends InsertBuilder.InsertResult, Filled extends keyof InsertBuilder<Result, never>>
	implements With.Aware, QueryBuilder {
	private constructor(
		private readonly wrapper: Client,
		private readonly options: InsertBuilder.Options,
		private readonly cteAliases: string[]
	) {}

	public static create(wrapper: Client): InsertBuilder.NewInsertBuilder {
		return new InsertBuilder(
			wrapper,
			{
				into: undefined,
				with: new With.Statement({}),
				values: undefined,
				onConflict: undefined,
				returning: new Returning(),
				from: undefined,
			},
			[]
		) as InsertBuilder.InsertBuilderState<InsertBuilder.AffectedRows, never>
	}

	public with(alias: string, expression: With.Expression): InsertBuilder.InsertBuilderState<Result, Filled | 'with'> {
		return this.withOption('with', this.options.with.withCte(alias, With.createLiteral(this.wrapper, expression)))
	}

	public into(intoTable: string): InsertBuilder.InsertBuilderState<Result, Filled | 'into'> {
		return this.withOption('into', intoTable)
	}

	public values(columns: QueryBuilder.Values): InsertBuilder.InsertBuilderState<Result, Filled | 'values'> {
		return this.withOption('values', QueryBuilder.resolveValues(columns))
	}

	public onConflict(
		type: InsertBuilder.ConflictActionType.update,
		target: InsertBuilder.ConflictTarget,
		values: QueryBuilder.Values
	): InsertBuilder.InsertBuilderState<Result, Filled | 'onConflict'>
	public onConflict(
		type: InsertBuilder.ConflictActionType.doNothing,
		target?: InsertBuilder.ConflictTarget
	): InsertBuilder.InsertBuilderState<Result, Filled | 'onConflict'>
	public onConflict(
		type: InsertBuilder.ConflictActionType,
		target?: InsertBuilder.ConflictTarget,
		values?: QueryBuilder.Values
	): InsertBuilder.InsertBuilderState<Result, Filled | 'onConflict'> {
		let conflictAction: InsertBuilder.ConflictAction
		if (type === InsertBuilder.ConflictActionType.update && values && target) {
			conflictAction = { type, values: QueryBuilder.resolveValues(values), target }
		} else if (type === InsertBuilder.ConflictActionType.doNothing) {
			conflictAction = { type, target }
		} else {
			throw Error()
		}
		return this.withOption('onConflict', conflictAction)
	}

	public returning(
		column: string | Literal
	): InsertBuilder.InsertBuilderState<Returning.Result[], Filled | 'returning'> {
		return this.withOption('returning', new Returning(column)) as InsertBuilder.InsertBuilderState<
			Returning.Result[],
			Filled | 'returning'
		>
	}

	public from(from: SelectBuilder.Callback): InsertBuilder.InsertBuilderState<Result, Filled | 'from'> {
		return this.withOption('from', from)
	}

	public createQuery(): Literal {
		const values = this.options.values
		const into = this.options.into

		if (into === undefined || values === undefined) {
			throw Error()
		}

		let from: Literal | undefined

		const cteAliases = [...this.options.with.getAliases(), ...this.cteAliases]
		if (this.options.from !== undefined) {
			let queryBuilder: SelectBuilder<SelectBuilder.Result, any> = SelectBuilder.create(this.wrapper).withCteAliases(
				cteAliases
			)
			queryBuilder = Object.values(values).reduce((qb, raw) => qb.select(raw), queryBuilder)
			queryBuilder = this.options.from(queryBuilder)
			from = queryBuilder.createQuery()
		}

		const compiler = new Compiler()
		const namespaceContext = new Compiler.NamespaceContext(this.wrapper.schema, new Set(cteAliases))
		return compiler.compileInsert({ ...this.options, values, into, from }, namespaceContext)
	}

	public async execute(): Promise<Result> {
		const query = this.createQuery()
		const result: Connection.Result = await this.wrapper.query(query.sql, query.parameters)
		return this.options.returning.parseResponse<Result>(result)
	}

	private withOption<K extends keyof InsertBuilder.Options, V extends InsertBuilder.Options[K]>(
		key: K,
		value: V
	): InsertBuilder.InsertBuilderState<Result, Filled | K> {
		return new InsertBuilder<Result, Filled | K>(
			this.wrapper,
			{ ...this.options, [key]: value },
			this.cteAliases
		) as InsertBuilder.InsertBuilderState<Result, Filled | K>
	}

	public withCteAliases(aliases: string[]): InsertBuilder.InsertBuilderState<Result, Filled> {
		return new InsertBuilder(this.wrapper, this.options, aliases) as InsertBuilder.InsertBuilderState<Result, Filled>
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

	export enum ConflictActionType {
		doNothing = 'doNothing',
		update = 'update',
	}

	export type ConflictAction =
		| { type: ConflictActionType.doNothing; target?: ConflictTarget }
		| { type: ConflictActionType.update; values: QueryBuilder.ResolvedValues; target: ConflictTarget }

	export type IndexColumns = string[]
	export type ConflictTarget = IndexColumns | { constraint: string }
}

export default InsertBuilder
