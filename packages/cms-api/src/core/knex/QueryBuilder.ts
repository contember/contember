import * as Knex from 'knex'
import ConditionBuilder from './ConditionBuilder'
import { Value } from './types'
import KnexWrapper from './KnexWrapper'
import WindowFunction from './WindowFunction'

type AffectedRows = number
type Returning = number | string

interface Raw {
	sql: string
	bindings: (Value | Knex.QueryBuilder)[]
}

class QueryBuilder<R = { [columnName: string]: any }[]> {
	constructor(public readonly wrapper: KnexWrapper, public readonly qb: Knex.QueryBuilder) {}

	public with(alias: string, select: QueryBuilder.Callback | Knex.Raw | QueryBuilder<any>): void {
		if (select instanceof QueryBuilder) {
			this.qb.with(alias, select.getSql())
		} else if (typeof select === 'function') {
			this.qb.with(alias, qb => select(new QueryBuilder(this.wrapper, qb)))
		} else {
			this.qb.with(alias, select)
		}
	}

	public from(tableName: string | Knex.Raw, alias?: string): void {
		let raw: Knex.Raw
		if (typeof tableName === 'string') {
			raw = this.raw('??', tableName)
		} else {
			raw = tableName
		}
		this.qb.from(this.aliasRaw(raw, alias))
	}

	public table(tableName: string, alias?: string): void {
		this.from(tableName, alias)
	}

	public select(columnName: QueryBuilder.ColumnIdentifier, alias?: string): void
	public select(callback: QueryBuilder.ColumnExpression, alias?: string): void
	public select(expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression, alias?: string): void {
		let raw = QueryBuilder.columnExpressionToRaw(this, expr)
		if (raw === undefined) {
			return
		}
		this.qb.select(this.aliasRaw(raw, alias))
	}

	public where(where: { [columName: string]: Value }): void
	public where(whereCondition: QueryBuilder.ConditionCallback): void
	public where(where: (QueryBuilder.ConditionCallback) | { [columName: string]: Value }): void {
		if (typeof where === 'function') {
			const builder = new ConditionBuilder.ConditionStringBuilder(this.wrapper)
			where(builder, this)
			const sql = builder.getSql()
			if (sql) {
				this.qb.where(sql)
			}
		} else {
			this.qb.where(where)
		}
	}

	public orderBy(columnName: QueryBuilder.ColumnIdentifier, direction: 'asc' | 'desc' = 'asc'): void {
		this.qb.orderBy(QueryBuilder.toFqn(columnName), direction)
	}

	public join(tableName: string, alias?: string, joinCondition?: (joinClause: ConditionBuilder) => void): void {
		this.qb.join(...this.buildJoinArguments(tableName, alias, joinCondition))
	}

	public leftJoin(tableName: string, alias?: string, joinCondition?: (joinClause: ConditionBuilder) => void): void {
		this.qb.leftJoin(...this.buildJoinArguments(tableName, alias, joinCondition))
	}

	public limit(limit: number, offset?: number): void {
		this.qb.limit(limit).offset(offset || 0)
	}

	public raw(sql: string, ...bindings: (Value | Knex.QueryBuilder)[]): Knex.Raw {
		return this.wrapper.raw(sql, ...bindings)
	}

	public async getResult(): Promise<R> {
		return await this.qb
	}

	public async delete(returning?: string | Knex.Raw): Promise<number> {
		return await this.qb.delete(returning as string)
	}

	public async update(data: { [column: string]: Value }): Promise<AffectedRows> {
		return await this.qb.update(data)
	}

	public async updateFrom(
		tableName: string,
		columns: QueryBuilder.ColumnExpressionMap,
		callback: QueryBuilder.Callback
	): Promise<AffectedRows> {
		const updateData = Object.entries(columns)
			.map(
				([key, value]): [string, Knex.Raw | undefined] => {
					if (typeof value === 'function') {
						return [key, value(new QueryBuilder.ColumnExpressionFactory(this))]
					}
					return [key, value]
				}
			)
			.filter(it => it[1] !== undefined)
			.reduce((result, [key, value]) => ({ ...result, [key]: value }), {})
		this.qb.table(tableName).update(updateData)
		const updateSql = this.qb.toSQL()
		const fromQb = this.wrapper.queryBuilder()
		callback(fromQb)
		const selectSql = fromQb.qb.toSQL()
		if (!selectSql.sql.startsWith('select *')) {
			throw new Error()
		}
		const query = this.wrapper.raw(
			updateSql.sql + ' ' + selectSql.sql.substring('select *'.length),
			...updateSql.bindings,
			...selectSql.bindings
		)
		return await query
	}

	public toString(): string {
		return this.qb.toString()
	}

	public getSql(): Knex.Raw {
		const sql = this.qb.toSQL()
		return this.wrapper.raw(sql.sql, ...sql.bindings)
	}

	private buildJoinArguments(
		tableName: string,
		alias?: string,
		joinCondition?: (joinClause: ConditionBuilder) => void
	): [string, Knex.Raw] {
		let raw: Knex.Raw | null = null
		if (joinCondition) {
			const builder = new ConditionBuilder.ConditionStringBuilder(this.wrapper)
			joinCondition(builder)
			raw = builder.getSql()
		}
		if (raw === null) {
			raw = this.wrapper.raw('true')
		}
		return [`${tableName} as ${alias || tableName}`, raw as Knex.Raw]
	}

	private aliasRaw(raw: Knex.Raw, alias?: string) {
		if (!alias) {
			return raw
		}
		return this.raw(((raw as any) as Raw).sql + ' as ??', ...((raw as any) as Raw).bindings, alias)
	}
}

namespace QueryBuilder {
	export type Callback = (qb: QueryBuilder) => void
	export type ConditionCallback = (whereClause: ConditionBuilder, qb: QueryBuilder<any>) => void

	type ColumnFqn = string
	type TableAliasAndColumn = [string, string]
	export type ColumnIdentifier = ColumnFqn | TableAliasAndColumn
	export type ColumnExpression =
		| Knex.Raw
		| ((expressionFactory: QueryBuilder.ColumnExpressionFactory) => Knex.Raw | undefined)
	export type ColumnExpressionMap = { [columnName: string]: QueryBuilder.ColumnExpression }

	export function toFqn(columnName: ColumnIdentifier): string {
		if (typeof columnName === 'string') {
			return columnName
		}
		return `${columnName[0]}.${columnName[1]}`
	}

	export function columnExpressionToRaw(
		qb: QueryBuilder<any>,
		expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression
	): Knex.Raw | undefined {
		if (typeof expr === 'function') {
			return expr(new QueryBuilder.ColumnExpressionFactory(qb))
		} else if (typeof expr === 'string' || Array.isArray(expr)) {
			return qb.raw('??', QueryBuilder.toFqn(expr))
		}
		return expr
	}

	export class ColumnExpressionFactory {
		constructor(private readonly qb: QueryBuilder<any>) {}

		public select(columnName: QueryBuilder.ColumnIdentifier): Knex.Raw {
			const columnFqn = QueryBuilder.toFqn(columnName)
			return this.qb.raw('??', columnFqn)
		}

		public selectValue(value: Value, type?: string): Knex.Raw {
			const sql = '?' + (type ? ` :: ${type}` : '')
			return this.qb.raw(sql, value)
		}

		public selectCondition(condition: ConditionCallback): Knex.Raw | undefined {
			const builder = new ConditionBuilder.ConditionStringBuilder(this.qb.wrapper)
			condition(builder, this.qb)
			return builder.getSql() || undefined
		}

		public raw(sql: string, ...bindings: (Value | Knex.QueryBuilder)[]): Knex.Raw {
			return this.qb.raw(sql, ...bindings)
		}

		public window(callback: (windowFunction: WindowFunction<false>) => WindowFunction<true>): Knex.Raw {
			return callback(WindowFunction.createEmpty(this.qb)).buildRaw()
		}
	}

	export interface Orderable {
		orderBy(columnName: QueryBuilder.ColumnIdentifier, direction?: 'asc' | 'desc'): void
	}
}

export default QueryBuilder
