import KnexWrapper from './KnexWrapper'
import * as Knex from 'knex'
import { QueryResult } from 'pg'
import { Raw, Value } from './types'
import Returning from './internal/Returning'
import With from './internal/With'
import SelectBuilder from './SelectBuilder'
import QueryBuilder from './QueryBuilder'
import { assertNever } from 'cms-common'

class InsertBuilder<Result extends InsertBuilder.InsertResult, Filled extends keyof InsertBuilder<Result, never>>
	implements With.Aware {
	private constructor(
		private readonly wrapper: KnexWrapper,
		private readonly options: InsertBuilder.Options,
		private cteAliases: string[]
	) {}

	public static create(wrapper: KnexWrapper): InsertBuilder.NewInsertBuilder {
		return new InsertBuilder(
			wrapper,
			{
				into: undefined,
				with: new With.Statement(wrapper, {}),
				values: undefined,
				onConflict: undefined,
				returning: new Returning(),
				from: undefined,
			},
			[]
		) as InsertBuilder.InsertBuilderState<InsertBuilder.AffectedRows, never>
	}

	public with(alias: string, expression: With.Expression): InsertBuilder.InsertBuilderState<Result, Filled | 'with'> {
		return this.withOption('with', this.options.with.withCte(alias, expression))
	}

	public into(intoTable: string): InsertBuilder.InsertBuilderState<Result, Filled | 'into'> {
		return this.withOption('into', intoTable)
	}

	public values(columns: InsertBuilder.Values): InsertBuilder.InsertBuilderState<Result, Filled | 'values'> {
		return this.withOption('values', columns)
	}

	public onConflict(
		type: InsertBuilder.ConflictActionType.update,
		target: InsertBuilder.ConflictTarget,
		values: InsertBuilder.Values
	): InsertBuilder.InsertBuilderState<Result, Filled | 'onConflict'>
	public onConflict(
		type: InsertBuilder.ConflictActionType.doNothing,
		target?: InsertBuilder.ConflictTarget,
	): InsertBuilder.InsertBuilderState<Result, Filled | 'onConflict'>
	public onConflict(
		type: InsertBuilder.ConflictActionType,
		target?: InsertBuilder.ConflictTarget,
		values?: InsertBuilder.Values
	): InsertBuilder.InsertBuilderState<Result, Filled | 'onConflict'> {
		let conflictAction: InsertBuilder.ConflictAction
		if (type === InsertBuilder.ConflictActionType.update && values && target) {
			conflictAction = { type, values, target }
		} else if (type === InsertBuilder.ConflictActionType.doNothing) {
			conflictAction = { type, target }
		} else {
			throw Error()
		}
		return this.withOption('onConflict', conflictAction)
	}

	public returning(
		column: string | Knex.Raw
	): InsertBuilder.InsertBuilderState<Returning.Result[], Filled | 'returning'> {
		return this.withOption('returning', new Returning(column)) as InsertBuilder.InsertBuilderState<
			Returning.Result[],
			Filled | 'returning'
		>
	}

	public from(from: SelectBuilder.Callback): InsertBuilder.InsertBuilderState<Result, Filled | 'from'> {
		return this.withOption('from', from)
	}

	public createQuery(): Raw {
		const columns = this.options.values
		const into = this.options.into

		if (into === undefined || columns === undefined) {
			throw Error()
		}

		const qb = this.wrapper.knex.queryBuilder()
		this.options.with.apply(qb)

		const insertFrom = this.options.from
		if (insertFrom !== undefined) {
			const columnNames = Object.keys(columns)
			qb.into(
				this.wrapper.raw(
					'??.?? (' + columnNames.map(() => '??').join(', ') + ')',
					this.wrapper.schema,
					into,
					...columnNames
				)
			)

			let queryBuilder = SelectBuilder.create(this.wrapper).withCteAliases([
				...this.options.with.getAliases(),
				...this.cteAliases,
			])
			const values = Object.values(this.getColumnValues(columns))
			queryBuilder = values.reduce((qb, raw) => qb.select(raw), queryBuilder)
			queryBuilder = insertFrom(queryBuilder)
			qb.insert(queryBuilder.createQuery())
		} else {
			qb.into(this.wrapper.raw('??.??', this.wrapper.schema, into))
			qb.insert(this.getColumnValues(columns))
		}

		const qbSql = qb.toSQL()
		let sql: string = qbSql.sql
		let bindings = qbSql.bindings

		if (this.options.onConflict) {
			sql += ' on conflict'
			if (!this.options.onConflict.target) {
			} else if (Array.isArray(this.options.onConflict.target)) {
				sql += ' (' + this.options.onConflict.target.map(() => '??').join(', ') + ')'
				bindings.push(...this.options.onConflict.target);
			} else if (this.options.onConflict.target.constraint) {
				sql += ' on constraint ??'
				bindings.push(this.options.onConflict.target.constraint)
			}

			switch (this.options.onConflict.type) {
				case InsertBuilder.ConflictActionType.doNothing:
					sql += ' do nothing'
					break
				case InsertBuilder.ConflictActionType.update:
					const values = this.getColumnValues(this.options.onConflict.values)
					const updateExpr = Object.keys(values).join(' = ?, ') + ' = ?'
					sql += '  do update set ' + updateExpr
					bindings.push(...Object.values(values))
					break
				default:
					assertNever(this.options.onConflict)
			}
		}
		const [sqlWithReturning, bindingsWithReturning] = this.options.returning.modifyQuery(sql, bindings)

		return this.wrapper.raw(sqlWithReturning, ...bindingsWithReturning)
	}

	public async execute(): Promise<Result> {
		const result: QueryResult = await this.createQuery()
		return this.options.returning.parseResponse<Result>(result)
	}

	private getColumnValues(values: InsertBuilder.Values): { [column: string]: Knex.Raw } {
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
		values: InsertBuilder.Values | undefined
		onConflict: InsertBuilder.ConflictAction | undefined
		returning: Returning
		from: SelectBuilder.Callback | undefined
	} & With.Options

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

	export type Values = { [columnName: string]: QueryBuilder.ColumnExpression | Value }

	export type ConflictAction =
		| { type: ConflictActionType.doNothing, target?: ConflictTarget }
		| { type: ConflictActionType.update, values: Values, target: ConflictTarget }

	export type IndexColumns = string[]
	export type ConflictTarget = IndexColumns | { constraint: string }
}

export default InsertBuilder
