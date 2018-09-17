import QueryBuilder from './QueryBuilder'
import KnexWrapper from './KnexWrapper'
import * as Knex from 'knex'

class InsertBuilder<Result extends InsertBuilder.InsertResult, Filled extends keyof InsertBuilder<Result, never>> {
	private constructor(
		private readonly wrapper: KnexWrapper,
		private readonly intoTable: string | undefined,
		private readonly cte: { [alias: string]: QueryBuilder.Callback },
		private readonly columns: { [columnName: string]: QueryBuilder.ColumnExpression } | undefined,
		private readonly onConflictAction: InsertBuilder.ConflictAction | undefined,
		private readonly returningColumn: string | undefined,
		private readonly insertFrom: QueryBuilder.Callback | undefined
	) {}

	public static create(wrapper: KnexWrapper): InsertBuilder.NewInsertBuilder {
		return new InsertBuilder(
			wrapper,
			undefined,
			{},
			undefined,
			undefined,
			undefined,
			undefined
		) as InsertBuilder.InsertBuilderState<InsertBuilder.AffectedRows, never>
	}

	public with(alias: string, callback: QueryBuilder.Callback): InsertBuilder.InsertBuilderState<Result, Filled> {
		return new InsertBuilder<Result, Filled>(
			this.wrapper,
			this.intoTable,
			{ ...this.cte, [alias]: callback },
			this.columns,
			this.onConflictAction,
			this.returningColumn,
			this.insertFrom
		) as InsertBuilder.InsertBuilderState<Result, Filled>
	}

	public into(tableName: string): InsertBuilder.InsertBuilderState<Result, Filled | 'into'> {
		return new InsertBuilder<Result, Filled | 'into'>(
			this.wrapper,
			tableName,
			this.cte,
			this.columns,
			this.onConflictAction,
			this.returningColumn,
			this.insertFrom
		) as InsertBuilder.InsertBuilderState<Result, Filled | 'into'>
	}

	public values(columns: {
		[columnName: string]: QueryBuilder.ColumnExpression
	}): InsertBuilder.InsertBuilderState<Result, Filled | 'values'> {
		return new InsertBuilder<Result, Filled | 'values'>(
			this.wrapper,
			this.intoTable,
			this.cte,
			columns,
			this.onConflictAction,
			this.returningColumn,
			this.insertFrom
		) as InsertBuilder.InsertBuilderState<Result, Filled | 'values'>
	}

	public onConflict(conflictAction: InsertBuilder.ConflictAction): InsertBuilder.InsertBuilderState<Result, Filled> {
		return new InsertBuilder<Result, Filled>(
			this.wrapper,
			this.intoTable,
			this.cte,
			this.columns,
			conflictAction,
			this.returningColumn,
			this.insertFrom
		) as InsertBuilder.InsertBuilderState<Result, Filled>
	}

	public returning(column: string): InsertBuilder.InsertBuilderState<InsertBuilder.Returning[], Filled> {
		return new InsertBuilder<InsertBuilder.Returning[], Filled>(
			this.wrapper,
			this.intoTable,
			this.cte,
			this.columns,
			this.onConflictAction,
			column,
			this.insertFrom
		) as InsertBuilder.InsertBuilderState<InsertBuilder.Returning[], Filled>
	}

	public from(from: QueryBuilder.Callback): InsertBuilder.InsertBuilderState<Result, Filled> {
		return new InsertBuilder<Result, Filled>(
			this.wrapper,
			this.intoTable,
			this.cte,
			this.columns,
			this.onConflictAction,
			this.returningColumn,
			from
		) as InsertBuilder.InsertBuilderState<Result, Filled>
	}

	public async execute(): Promise<Result> {
		const columns = this.columns
		const into = this.intoTable

		if (into === undefined || columns === undefined) {
			throw Error()
		}

		const qb = this.wrapper.knex.queryBuilder()
		Object.entries(this.cte).forEach(([alias, cb]) => qb.with(alias, qb => cb(new QueryBuilder(this.wrapper, qb))))

		const insertFrom = this.insertFrom
		if (insertFrom !== undefined) {
			const columnNames = Object.keys(columns)
			qb.into(this.wrapper.raw('?? (' + columnNames.map(() => '??').join(', ') + ')', into, ...columnNames))
			qb.insert((qb: Knex.QueryBuilder) => {
				const queryBuilder = new QueryBuilder(this.wrapper, qb)
				const values = Object.values(this.getColumnValues(queryBuilder))
				values.forEach(raw => queryBuilder.qb.select(raw))
				insertFrom(queryBuilder)
			})
		} else {
			qb.into(into)
			qb.insert(this.getColumnValues(new QueryBuilder(this.wrapper, qb)))
		}

		const qbSql = qb.toSQL()
		let sql: string = qbSql.sql
		let bindings = qbSql.bindings

		switch (this.onConflictAction) {
			case undefined:
				break
			case InsertBuilder.ConflictAction.doNothing:
				sql += ' on conflict do nothing'
				break
			default:
				throw Error()
		}
		if (this.returningColumn) {
			sql += ' returning ??'
			bindings.push(this.returningColumn)
		}

		return await this.wrapper.raw(sql, ...qbSql.bindings)
	}

	private getColumnValues(queryBuilder: QueryBuilder): { [column: string]: Knex.Raw } {
		const columns = this.columns
		if (columns === undefined) {
			throw Error()
		}

		return Object.entries(columns)
			.map(
				([key, value]): [string, Knex.Raw | undefined] => {
					if (typeof value === 'function') {
						return [key, value(new QueryBuilder.ColumnExpressionFactory(queryBuilder))]
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

	export type InsertBuilderWithoutExecute<
		Result extends InsertResult,
		Filled extends keyof InsertBuilder<Result, Filled>
	> = Pick<InsertBuilder<Result, Filled>, Exclude<keyof InsertBuilder<Result, Filled>, 'execute'>>

	export type InsertBuilderState<Result extends InsertResult, Filled extends keyof InsertBuilder<Result, Filled>> =
		| 'into'
		| 'values' extends Filled
		? InsertBuilder<Result, Filled>
		: InsertBuilderWithoutExecute<Result, Filled>

	export type NewInsertBuilder = InsertBuilder.InsertBuilderState<InsertBuilder.AffectedRows, never>

	export enum ConflictAction {
		doNothing = 'doNothing'
		// update = 'update',
	}
}

export default InsertBuilder
