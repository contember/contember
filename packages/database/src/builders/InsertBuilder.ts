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
import { Where } from './internal/Where'

class InsertBuilder<Result extends InsertBuilder.InsertResult> implements With.Aware, QueryBuilder {
	private constructor(private readonly options: InsertBuilder.Options) {}

	public static create(): InsertBuilder<InsertBuilder.AffectedRows> {
		return new InsertBuilder({
			into: undefined,
			with: new With.Statement({}),
			values: undefined,
			onConflict: undefined,
			returning: new Returning(),
			from: undefined,
		})
	}

	public with(alias: string, expression: SubQueryExpression): InsertBuilder<Result> {
		return this.withOption('with', this.options.with.withCte(alias, createSubQueryLiteralFactory(expression)))
	}

	public into(intoTable: string): InsertBuilder<Result> {
		return this.withOption('into', intoTable)
	}

	public values(columns: QueryBuilder.Values): InsertBuilder<Result> {
		return this.withOption('values', resolveValues(columns))
	}

	public onConflict(
		action: ConflictActionType.update,
		target: InsertBuilder.ConflictTarget,
		values: QueryBuilder.Values,
		where?: Where.Expression,
	): InsertBuilder<Result>
	public onConflict(action: ConflictActionType.doNothing, target?: InsertBuilder.ConflictTarget): InsertBuilder<Result>
	public onConflict(
		action: ConflictActionType,
		target?: InsertBuilder.ConflictTarget,
		values?: QueryBuilder.Values,
		where?: Where.Expression,
	): InsertBuilder<Result> {
		let conflictAction: InsertBuilder.ConflictAction
		if (action === ConflictActionType.update && values && target) {
			const whereStm = new Where.Statement([])
			conflictAction = {
				type: action,
				values: resolveValues(values),
				target,
				where: where ? whereStm.withWhere(where) : whereStm,
			}
		} else if (action === ConflictActionType.doNothing) {
			conflictAction = { type: action, target }
		} else {
			throw Error()
		}
		return this.withOption('onConflict', conflictAction)
	}

	public returning(column: string | Literal): InsertBuilder<Returning.Result[]> {
		return this.withOption('returning', new Returning(column)) as InsertBuilder<Returning.Result[]>
	}

	public from(from: SelectBuilder.Callback): InsertBuilder<Result> {
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
			let queryBuilder: SelectBuilder<SelectBuilder.Result> = SelectBuilder.create()
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
	): InsertBuilder<Result> {
		return new InsertBuilder<Result>({ ...this.options, [key]: value })
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

	export type ConflictAction =
		| { type: ConflictActionType.doNothing; target?: ConflictTarget }
		| (Where.Options & {
				type: ConflictActionType.update
				values: QueryBuilder.ResolvedValues
				target: ConflictTarget
		  })

	export type IndexColumns = string[]
	export type ConflictTarget = IndexColumns | { constraint: string }
}

export { InsertBuilder }
