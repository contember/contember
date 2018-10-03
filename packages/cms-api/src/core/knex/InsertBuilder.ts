import QueryBuilder from './QueryBuilder'
import KnexWrapper from './KnexWrapper'
import * as Knex from 'knex'
import { QueryResult } from 'pg'

class InsertBuilder<Result extends InsertBuilder.InsertResult, Filled extends keyof InsertBuilder<Result, never>> {
	private constructor(
		private readonly wrapper: KnexWrapper,
		private readonly options: InsertBuilder.Options,
		private readonly schema: string
	) {}

	public static create(wrapper: KnexWrapper, schema: string): InsertBuilder.NewInsertBuilder {
		return new InsertBuilder(
			wrapper,
			{
				intoTable: undefined,
				cte: {},
				columns: undefined,
				conflictAction: undefined,
				returningColumn: undefined,
				insertFrom: undefined,
			},
			schema
		) as InsertBuilder.InsertBuilderState<InsertBuilder.AffectedRows, never>
	}

	public with(alias: string, callback: QueryBuilder.Callback): InsertBuilder.InsertBuilderState<Result, Filled> {
		return new InsertBuilder<Result, Filled>(
			this.wrapper,
			{ ...this.options, cte: { ...this.options.cte, [alias]: callback } },
			this.schema
		) as InsertBuilder.InsertBuilderState<Result, Filled>
	}

	public into(intoTable: string): InsertBuilder.InsertBuilderState<Result, Filled | 'into'> {
		return new InsertBuilder<Result, Filled | 'into'>(
			this.wrapper,
			{ ...this.options, intoTable },
			this.schema
		) as InsertBuilder.InsertBuilderState<Result, Filled | 'into'>
	}

	public values(columns: InsertBuilder.Values): InsertBuilder.InsertBuilderState<Result, Filled | 'values'> {
		return new InsertBuilder<Result, Filled | 'values'>(
			this.wrapper,
			{ ...this.options, columns },
			this.schema
		) as InsertBuilder.InsertBuilderState<Result, Filled | 'values'>
	}

	public onConflict(
		type: InsertBuilder.ConflictActionType.update,
		target: InsertBuilder.ConflictTarget,
		values: InsertBuilder.Values
	): InsertBuilder.InsertBuilderState<Result, Filled>
	public onConflict(type: InsertBuilder.ConflictActionType.doNothing): InsertBuilder.InsertBuilderState<Result, Filled>
	public onConflict(
		type: InsertBuilder.ConflictActionType,
		target?: InsertBuilder.ConflictTarget,
		values?: InsertBuilder.Values
	): InsertBuilder.InsertBuilderState<Result, Filled> {
		let conflictAction: InsertBuilder.ConflictAction
		if (type === InsertBuilder.ConflictActionType.update && values && target) {
			conflictAction = { type, values, target }
		} else if (type === InsertBuilder.ConflictActionType.doNothing) {
			conflictAction = { type }
		} else {
			throw Error()
		}

		return new InsertBuilder<Result, Filled>(
			this.wrapper,
			{ ...this.options, conflictAction },
			this.schema
		) as InsertBuilder.InsertBuilderState<Result, Filled>
	}

	public returning(column: string | Knex.Raw): InsertBuilder.InsertBuilderState<InsertBuilder.Returning[], Filled> {
		return new InsertBuilder<InsertBuilder.Returning[], Filled>(
			this.wrapper,
			{ ...this.options, returningColumn: column },
			this.schema
		) as InsertBuilder.InsertBuilderState<InsertBuilder.Returning[], Filled>
	}

	public from(from: QueryBuilder.Callback): InsertBuilder.InsertBuilderState<Result, Filled> {
		return new InsertBuilder<Result, Filled>(
			this.wrapper,
			{ ...this.options, insertFrom: from },
			this.schema
		) as InsertBuilder.InsertBuilderState<Result, Filled>
	}

	public createQuery(): Knex.Raw {
		const columns = this.options.columns
		const into = this.options.intoTable

		if (into === undefined || columns === undefined) {
			throw Error()
		}

		const qb = this.wrapper.knex.queryBuilder()
		Object.entries(this.options.cte).forEach(([alias, cb]) =>
			qb.with(alias, qb => cb(new QueryBuilder(this.wrapper, qb, this.schema)))
		)

		const insertFrom = this.options.insertFrom
		if (insertFrom !== undefined) {
			const columnNames = Object.keys(columns)
			qb.into(
				this.wrapper.raw('??.?? (' + columnNames.map(() => '??').join(', ') + ')', this.schema, into, ...columnNames)
			)
			qb.insert((qb: Knex.QueryBuilder) => {
				const queryBuilder = new QueryBuilder(this.wrapper, qb, this.schema, Object.keys(this.options.cte))
				const values = Object.values(this.getColumnValues(columns))
				values.forEach(raw => queryBuilder.qb.select(raw))
				insertFrom(queryBuilder)
			})
		} else {
			qb.into(this.wrapper.raw('??.??', this.schema, into))
			qb.insert(this.getColumnValues(columns))
		}

		const qbSql = qb.toSQL()
		let sql: string = qbSql.sql
		let bindings = qbSql.bindings

		if (this.options.conflictAction) {
			switch (this.options.conflictAction.type) {
				case InsertBuilder.ConflictActionType.doNothing:
					sql += ' on conflict do nothing'
					break
				case InsertBuilder.ConflictActionType.update:
					const values = this.getColumnValues(this.options.conflictAction.values)
					const updateExpr = Object.keys(values).join(' = ?, ') + ' = ?'
					sql += ' on conflict (?) do update set ' + updateExpr
					const indexExpr = this.wrapper.raw(
						this.options.conflictAction.target.map(() => '??').join(', '),
						...this.options.conflictAction.target
					)
					bindings.push(indexExpr)
					bindings.push(...Object.values(values))
					break
				default:
					throw Error()
			}
		}
		if (this.options.returningColumn) {
			sql += ' returning ??'
			bindings.push(this.options.returningColumn)
		}

		return this.wrapper.raw(sql, ...qbSql.bindings)
	}

	public async execute(): Promise<Result> {
		const result: QueryResult = await this.createQuery()

		const returningColumn = this.options.returningColumn
		if (returningColumn) {
			return (typeof returningColumn === 'string' ? result.rows.map(it => it[returningColumn]) : result) as Result
		} else {
			return result.rowCount as Result
		}
	}

	private getColumnValues(values: InsertBuilder.Values): { [column: string]: Knex.Raw } {
		return Object.entries(values)
			.map(
				([key, value]): [string, Knex.Raw | undefined] => {
					if (typeof value === 'function') {
						return [key, value(new QueryBuilder.ColumnExpressionFactory(this.wrapper))]
					}
					return [key, value]
				}
			)
			.filter((it): it is [string, Knex.Raw] => it[1] !== undefined)
			.reduce((result, [key, value]) => ({ ...result, [key]: value }), {})
	}
}

namespace InsertBuilder {
	export type AffectedRows = number
	export type Returning = number | string
	export type InsertResult = AffectedRows | Returning[]

	export interface Options {
		intoTable: string | undefined
		cte: { [alias: string]: QueryBuilder.Callback }
		columns: InsertBuilder.Values | undefined
		conflictAction: InsertBuilder.ConflictAction | undefined
		returningColumn: string | Knex.Raw | undefined
		insertFrom: QueryBuilder.Callback | undefined
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

	export type Values = { [columnName: string]: QueryBuilder.ColumnExpression }

	export type ConflictAction =
		| { type: ConflictActionType.doNothing }
		| { type: ConflictActionType.update; values: Values; target: ConflictTarget }

	export type IndexColumns = string[]
	export type ConflictTarget = IndexColumns
}

export default InsertBuilder
