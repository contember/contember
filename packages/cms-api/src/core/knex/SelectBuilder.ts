import ConditionBuilder from './ConditionBuilder'
import KnexWrapper from './KnexWrapper'
import With from './internal/With'
import Where from './internal/Where'
import QueryBuilder from './QueryBuilder'
import { QueryResult } from 'pg'
import { aliasLiteral } from './utils'
import Literal from './Literal'
import Compiler from './Compiler'

class SelectBuilder<Result = SelectBuilder.Result, Filled extends keyof SelectBuilder<Result, never> = never>
	implements With.Aware, Where.Aware, QueryBuilder.Orderable<SelectBuilder<Result, Filled>>, QueryBuilder {
	constructor(
		public readonly wrapper: KnexWrapper,
		private readonly options: SelectBuilder.Options,
		private readonly cteAliases: Set<string> = new Set()
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
		return this.withOption('with', this.options.with.withCte(alias, expression)).withCteAliases([
			...this.cteAliases,
			alias,
		])
	}

	public from(tableName: string | Literal, alias?: string): SelectBuilder<Result, Filled | 'from'> {
		return this.withOption('from', [tableName, alias])
	}

	public select(columnName: QueryBuilder.ColumnIdentifier, alias?: string): SelectBuilder<Result, Filled | 'select'>
	public select(callback: QueryBuilder.ColumnExpression, alias?: string): SelectBuilder<Result, Filled | 'select'>
	public select(
		expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression,
		alias?: string
	): SelectBuilder<Result, Filled | 'select'> {
		let raw = QueryBuilder.columnExpressionToLiteral(this.wrapper, expr)
		if (raw === undefined) {
			return this
		}
		return this.withOption('select', [...this.options.select, aliasLiteral(raw, alias)])
	}

	public where(where: Where.Expression): SelectBuilder<Result, Filled | 'where'> {
		return this.withOption('where', this.options.where.withWhere(where))
	}

	public orderBy(
		columnName: QueryBuilder.ColumnIdentifier,
		direction: 'asc' | 'desc' = 'asc'
	): SelectBuilder<Result, Filled | 'orderBy'> {
		return this.withOption('orderBy', [
			...this.options.orderBy,
			[new Literal(QueryBuilder.toFqnWrap(columnName)), direction],
		])
	}

	public join(
		table: string,
		alias?: string,
		condition?: SelectBuilder.JoinCondition
	): SelectBuilder<Result, Filled | 'join'> {
		return this.withOption('join', [
			...this.options.join,
			{ type: 'inner', table, alias, condition: this.joinConditionToLiteral(condition) },
		])
	}

	public leftJoin(
		table: string,
		alias?: string,
		condition?: SelectBuilder.JoinCondition
	): SelectBuilder<Result, Filled | 'join'> {
		return this.withOption('join', [
			...this.options.join,
			{ type: 'left', table, alias, condition: this.joinConditionToLiteral(condition) },
		])
	}

	private joinConditionToLiteral(joinCondition?: SelectBuilder.JoinCondition): Literal | undefined {
		if (joinCondition === undefined) {
			return undefined
		}
		const builder = new ConditionBuilder.ConditionStringBuilder(this.wrapper)
		joinCondition(builder)

		return builder.getSql() || undefined
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

	public async getResult(): Promise<Result[]> {
		const query = this.createQuery()
		const result: QueryResult = await this.wrapper.raw(query.sql, ...query.parameters)
		return (result.rows as any) as Result[]
	}

	public createQuery(): Literal {
		// const sql = qb.toSQL()
		// return this.wrapper.raw(sql.sql, ...sql.bindings).options({ meta: this.options.meta })

		const compiler = new Compiler()

		const namespaceContext = new Compiler.NamespaceContext(this.wrapper.schema, this.cteAliases)
		return compiler.compileSelect(this.options, namespaceContext)
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
		return new SelectBuilder(this.wrapper, this.options, new Set(aliases))
	}
}

namespace SelectBuilder {
	export type Callback = (qb: SelectBuilder<any, any>) => SelectBuilder<any, any>

	export type Result = { [columnName: string]: any }

	export type Options = With.Options &
		Where.Options & {
			select: Literal[]
			limit: undefined | [number, number]
			from: undefined | [Literal | string, string | undefined]
			orderBy: ([Literal, 'asc' | 'desc'])[]
			join: ({
				type: 'inner' | 'left'
				table: string
				alias: string | undefined
				condition: Literal | undefined
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
