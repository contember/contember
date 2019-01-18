import Knex from 'knex'
import ConditionBuilder from './ConditionBuilder'
import { Raw, Value } from './types'
import KnexWrapper from './KnexWrapper'
import With from './internal/With'
import Where from './internal/Where'
import { assertNever } from 'cms-common'
import QueryBuilder from './QueryBuilder'
import { QueryResult } from 'pg'

class SelectBuilder<Result = SelectBuilder.Result, Filled extends keyof SelectBuilder<Result, never> = never>
	implements With.Aware, Where.Aware, QueryBuilder.Orderable<SelectBuilder<Result, Filled>> {
	constructor(
		public readonly wrapper: KnexWrapper,
		private readonly options: SelectBuilder.Options,
		private readonly cteAliases: string[] = []
	) {}

	public static create<Result = SelectBuilder.Result>(wrapper: KnexWrapper): SelectBuilder<Result, never> {
		return new SelectBuilder(wrapper, {
			from: undefined,
			orderBy: [],
			join: [],
			limit: undefined,
			select: [],
			with: new With.Statement(wrapper, {}),
			where: new Where.Statement(wrapper, []),
			lock: undefined,
			meta: {},
		})
	}

	public with(alias: string, expression: With.Expression): SelectBuilder<Result, Filled | 'with'> {
		return this.withOption('with', this.options.with.withCte(alias, expression))
	}

	public from(tableName: string | Knex.Raw, alias?: string): SelectBuilder<Result, Filled | 'from'> {
		return this.withOption('from', [tableName, alias])
	}

	public select(columnName: QueryBuilder.ColumnIdentifier, alias?: string): SelectBuilder<Result, Filled | 'select'>
	public select(callback: QueryBuilder.ColumnExpression, alias?: string): SelectBuilder<Result, Filled | 'select'>
	public select(
		expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression,
		alias?: string
	): SelectBuilder<Result, Filled | 'select'> {
		let raw = QueryBuilder.columnExpressionToRaw(this.wrapper, expr)
		if (raw === undefined) {
			return this
		}
		return this.withOption('select', [...this.options.select, this.aliasRaw(raw, alias)])
	}

	public where(where: Where.Expression): SelectBuilder<Result, Filled | 'where'> {
		return this.withOption('where', this.options.where.withWhere(where))
	}

	public orderBy(
		columnName: QueryBuilder.ColumnIdentifier,
		direction: 'asc' | 'desc' = 'asc'
	): SelectBuilder<Result, Filled | 'orderBy'> {
		return this.withOption('orderBy', [...this.options.orderBy, [QueryBuilder.toFqn(columnName), direction]])
	}

	public join(
		table: string,
		alias?: string,
		condition?: SelectBuilder.JoinCondition
	): SelectBuilder<Result, Filled | 'join'> {
		return this.withOption('join', [...this.options.join, { type: 'inner', table, alias, condition }])
	}

	public leftJoin(
		table: string,
		alias?: string,
		condition?: SelectBuilder.JoinCondition
	): SelectBuilder<Result, Filled | 'join'> {
		return this.withOption('join', [...this.options.join, { type: 'left', table, alias, condition }])
	}

	public limit(limit: number, offset?: number): SelectBuilder<Result, Filled | 'limit'> {
		return this.withOption('limit', [limit, offset || 0])
	}

	public lock(type: SelectBuilder.LockType): SelectBuilder<Result, Filled | 'lock'> {
		return this.withOption('lock', type)
	}

	public meta(key: string, value: any): SelectBuilder<Result, Filled | 'meta'> {
		return this.withOption('meta', { ...this.options.meta, [key]: value })
	}

	public raw(sql: string, ...bindings: (Value | Knex.QueryBuilder)[]): Knex.Raw {
		return this.wrapper.raw(sql, ...bindings)
	}

	public async getResult(): Promise<Result[]> {
		const result: QueryResult = await this.createQuery()
		return (result.rows as any) as Result[]
	}

	public createQuery(): Raw {
		const qb = this.wrapper.knex.queryBuilder()

		this.options.with.apply(qb)

		if (this.options.from !== undefined) {
			const [from, alias] = this.options.from
			qb.from(this.aliasRaw(this.prependSchema(from), alias))
		}

		this.options.join.forEach(({ table, alias, condition, type }) => {
			const [tableArg, conditionArg] = this.buildJoinArguments(table, alias, condition)
			switch (type) {
				case 'inner':
					qb.join(tableArg, conditionArg)
					break
				case 'left':
					qb.leftJoin(tableArg, conditionArg)
					break
				default:
					assertNever(type)
			}
		})

		this.options.select.forEach(it => qb.select(it))
		this.options.where.apply(qb)

		if (this.options.limit) {
			const [limit, offset] = this.options.limit
			qb.limit(limit).offset(offset)
		}

		this.options.orderBy.forEach(([column, direction]) => qb.orderBy(column, direction))

		let { sql, bindings } = qb.toSQL()
		if (this.options.lock !== undefined) {
			switch (this.options.lock) {
				case SelectBuilder.LockType.forUpdate:
					sql += ' for update'
					break
				case SelectBuilder.LockType.forNoKeyUpdate:
					sql += ' for no key update'
					break
				case SelectBuilder.LockType.forShare:
					sql += ' for share'
					break
				case SelectBuilder.LockType.forKeyShare:
					sql += ' for key share'
					break
				default:
					assertNever(this.options.lock)
			}
		}

		return this.wrapper.raw(sql, ...bindings).options({ meta: this.options.meta })
	}

	private buildJoinArguments(
		tableName: string,
		alias?: string,
		joinCondition?: (joinClause: ConditionBuilder) => void
	): [Knex.Raw, Knex.Raw] {
		let raw: Knex.Raw | null = null
		if (joinCondition) {
			const builder = new ConditionBuilder.ConditionStringBuilder(this.wrapper)
			joinCondition(builder)
			raw = builder.getSql()
		}
		if (raw === null) {
			raw = this.wrapper.raw('true')
		}
		const from = this.prependSchema(tableName)
		return [this.raw('?? as ??', from, alias || tableName), raw]
	}

	private aliasRaw(raw: Knex.Raw, alias?: string) {
		if (!alias) {
			return raw
		}
		return this.raw(((raw as any) as Raw).sql + ' as ??', ...((raw as any) as Raw).bindings, alias)
	}

	private prependSchema(tableExpression: string | Knex.Raw): Knex.Raw {
		if (typeof tableExpression !== 'string') {
			return tableExpression
		}
		return this.options.with.includes(tableExpression) || this.cteAliases.includes(tableExpression)
			? this.raw('??', tableExpression)
			: this.raw('??.??', this.wrapper.schema, tableExpression)
	}

	protected withOption<K extends keyof SelectBuilder.Options, V extends SelectBuilder.Options[K]>(
		key: K,
		value: V
	): SelectBuilder<Result, Filled | K> {
		return new SelectBuilder<Result, Filled | K>(
			this.wrapper,
			{ ...this.options, [key]: value },
			this.cteAliases
		) as SelectBuilder<Result, Filled | K>
	}

	public withCteAliases(aliases: string[]): SelectBuilder<Result, Filled> {
		return new SelectBuilder(this.wrapper, this.options, aliases)
	}
}

namespace SelectBuilder {
	export type Callback = (qb: SelectBuilder<any, any>) => SelectBuilder<any, any>

	export type Result = { [columnName: string]: any }

	export type Options = With.Options &
		Where.Options & {
			select: Knex.Raw[]
			limit: undefined | [number, number]
			from: undefined | [Knex.Raw | string, string | undefined]
			orderBy: ([string, 'asc' | 'desc'])[]
			join: ({
				type: 'inner' | 'left'
				table: string
				alias: string | undefined
				condition: JoinCondition | undefined
			})[]
			lock?: LockType
			meta: Record<string, any>
		}

	export enum LockType {
		forUpdate = 'forUpdate',
		forNoKeyUpdate = 'forNoKeyUpdate',
		forShare = 'forShare',
		forKeyShare = 'forKeyShare',
	}

	export type JoinCondition = (joinClause: ConditionBuilder) => void
}

export default SelectBuilder
