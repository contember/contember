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

	public values(values: QueryBuilder.Values | QueryBuilder.Values[]): InsertBuilder<Result> {
		return this.withOption('values', (Array.isArray(values) ? values : [values]).map(resolveValues))
	}

	public onConflict(
		action: ConflictActionType.update,
		target: InsertBuilder.ConflictTarget,
		values: QueryBuilder.Values,
		where?: Where.Expression,
	): InsertBuilder<Result>
	public onConflict(
		action: ConflictActionType.doNothing,
		target?: InsertBuilder.ConflictTarget,
	): InsertBuilder<Result>
	public onConflict(
		action: ConflictActionType,
		target?: InsertBuilder.ConflictTarget,
		values?: QueryBuilder.Values,
		where?: Where.Expression,
	): InsertBuilder<Result> {
		let conflictAction: InsertBuilder.ConflictAction
		const conflictTarget: InsertBuilder.ConflictTargetOptions | undefined = (() => {
			if (!target) {
				return undefined
			}
			if (Array.isArray(target)) {
				return {
					columns: target,
					where: new Where.Statement([]),
				}
			}
			if ('constraint' in target) {
				return target
			}
			const whereStm = new Where.Statement([])
			return {
				columns: target.columns,
				where: target.where ? whereStm.withWhere(target.where) : whereStm,
			}
		})()

		if (action === ConflictActionType.update && values && conflictTarget) {
			const whereStm = new Where.Statement([])
			conflictAction = {
				type: action,
				values: resolveValues(values),
				target: conflictTarget,
				where: where ? whereStm.withWhere(where) : whereStm,
			}
		} else if (action === ConflictActionType.doNothing) {
			conflictAction = { type: action, target: conflictTarget }
		} else {
			throw Error()
		}
		return this.withOption('onConflict', conflictAction)
	}

	public returning<R extends Returning.Result = Returning.Result>(...columns: Returning.ReturningColumn[]): InsertBuilder<R[]> {
		return this.withOption('returning', new Returning(columns)) as InsertBuilder<any>
	}

	public from(from: SelectBuilder.Callback): InsertBuilder<Result> {
		return this.withOption('from', from)
	}

	public createQuery(context: Compiler.Context): Literal {
		const values = this.options.values
		const into = this.options.into

		if (into === undefined || values === undefined) {
			throw new Error('InsertBuilder: specify "into" and "values"')
		}

		let from: Literal | undefined

		if (this.options.from !== undefined) {
			let queryBuilder: SelectBuilder<SelectBuilder.Result> = SelectBuilder.create()
			if (values.length !== 1) {
				throw new Error('InsertBuilder: cannot use multiple values when using "from"')
			}
			queryBuilder = Object.values(values[0]).reduce((qb, raw) => qb.select(raw), queryBuilder)
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
		values: QueryBuilder.ResolvedValues[] | undefined
		onConflict: ConflictAction | undefined
		returning: Returning
		from: SelectBuilder.Callback | undefined
	} & With.Options

	export type ResolvedOptions = Pick<Options, Exclude<keyof Options, 'from'>> & {
		from: Literal | undefined
		into: Exclude<Options['into'], undefined>
		values: Exclude<Options['values'], undefined>
	}

	export type ConflictTargetOptions =
		| ({ columns: IndexColumns} & Where.Options)
		| { constraint: string }

	type DoNothingConflictAction = {
		type: ConflictActionType.doNothing
		target?: ConflictTargetOptions
	}

	type DoUpdateConflictAction =
		& Where.Options
		& {
			type: ConflictActionType.update
			values: QueryBuilder.ResolvedValues
			target: ConflictTargetOptions
		}

	export type ConflictAction =
		| DoNothingConflictAction
		| DoUpdateConflictAction

	export type IndexColumns = string[]
	export type ConflictTarget =
		| IndexColumns
		| { columns: IndexColumns; where?: Where.Expression }
		| { constraint: string }
}

export { InsertBuilder }
