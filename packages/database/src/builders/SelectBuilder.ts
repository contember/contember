import { With } from './internal/With'
import { Where } from './internal/Where'
import { aliasLiteral } from '../utils'
import { Compiler } from './Compiler'
import { QueryBuilder } from './QueryBuilder'
import { Client, Connection } from '../client'
import { Literal } from '../Literal'
import { ConditionBuilder, ConditionCallback, ConditionExpression } from './ConditionBuilder'
import { LockModifier, LockType } from './LockType'
import { columnExpressionToLiteral, toFqnWrap } from './utils'
import { createSubQueryLiteralFactory, SubQueryExpression, SubQueryLiteralFactory } from './internal/Subqueries'

export type SelectBuilderSpecification = <Result>(qb: SelectBuilder<Result>) => SelectBuilder<Result>

class SelectBuilder<Result = SelectBuilder.Result> implements With.Aware, Where.Aware, QueryBuilder.Orderable<SelectBuilder<Result>>, QueryBuilder {
	constructor(public readonly options: SelectBuilder.Options) {}

	public static create<Result = SelectBuilder.Result>() {
		return new SelectBuilder<Result>({
			from: undefined,
			orderBy: [],
			join: [],
			limit: [undefined, undefined],
			select: [],
			with: new With.Statement({}),
			where: new Where.Statement([]),
			grouping: {
				groupingElement: [],
			},
			lock: undefined,
			meta: {},
		})
	}

	public with(alias: string, expression: SubQueryExpression): SelectBuilder<Result> {
		return this.withOption('with', this.options.with.withCte(alias, createSubQueryLiteralFactory(expression), false))
	}

	public withRecursive(alias: string, expression: SubQueryExpression, columns?: string[]): SelectBuilder<Result> {
		return this.withOption(
			'with',
			this.options.with.withCte(alias, createSubQueryLiteralFactory(expression), true, columns),
		)
	}

	public unionAll(expression: SubQueryExpression): SelectBuilder<Result> {
		return this.withOption('union', {
			type: 'all',
			literal: createSubQueryLiteralFactory(expression),
		})
	}

	public unionDistinct(expression: SubQueryExpression): SelectBuilder<Result> {
		return this.withOption('union', {
			type: 'distinct',
			literal: createSubQueryLiteralFactory(expression),
		})
	}

	public from(tableName: string | Literal, alias?: string): SelectBuilder<Result> {
		return this.withOption('from', [...(this.options.from || []), [tableName, alias]])
	}

	public distinct(...on: (QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression)[]): SelectBuilder<Result> {
		const onLiterals = on.map(columnExpressionToLiteral).filter((it): it is Literal => it !== undefined)
		return this.withOption('distinct', onLiterals)
	}

	public select(columnName: QueryBuilder.ColumnIdentifier, alias?: string): SelectBuilder<Result>
	public select(callback: QueryBuilder.ColumnExpression, alias?: string): SelectBuilder<Result>
	public select(
		expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression,
		alias?: string,
	): SelectBuilder<Result> {
		let raw = columnExpressionToLiteral(expr)
		if (raw === undefined) {
			return this
		}
		return this.withOption('select', [...this.options.select, aliasLiteral(raw, alias)])
	}

	public where(where: Where.Expression): SelectBuilder<Result> {
		return this.withOption('where', this.options.where.withWhere(where))
	}

	public orderBy(
		expression: QueryBuilder.ColumnIdentifier | Literal,
		direction: SelectBuilder.OrderByDirection = 'asc',
	): SelectBuilder<Result> {
		const literal = expression instanceof Literal ? expression : new Literal(toFqnWrap(expression))
		return this.withOption('orderBy', [...this.options.orderBy, [literal, direction]])
	}

	public join(table: string | Literal, alias?: string, condition?: SelectBuilder.JoinCondition): SelectBuilder<Result> {
		return this.withOption('join', [
			...this.options.join,
			{ type: 'inner', table, alias, condition: this.joinConditionToLiteral(condition) },
		])
	}

	public leftJoin(
		table: string | Literal,
		alias?: string,
		condition?: SelectBuilder.JoinCondition,
	): SelectBuilder<Result> {
		return this.withOption('join', [
			...this.options.join,
			{ type: 'left', table, alias, condition: this.joinConditionToLiteral(condition) },
		])
	}

	private joinConditionToLiteral(joinCondition?: SelectBuilder.JoinCondition): Literal | undefined {
		if (joinCondition === undefined) {
			return undefined
		}
		const builder = ConditionBuilder.process(joinCondition)

		return builder.getSql() || undefined
	}

	public groupBy(columnName: QueryBuilder.ColumnIdentifier): SelectBuilder<Result>
	public groupBy(callback: QueryBuilder.ColumnExpression): SelectBuilder<Result>
	public groupBy(expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression): SelectBuilder<Result> {
		let raw = columnExpressionToLiteral(expr)
		if (raw === undefined) {
			return this
		}
		return this.withOption('grouping', {
			...this.options.grouping,
			groupingElement: [...this.options.grouping.groupingElement, raw],
		})
	}

	public limit(limit?: number, offset?: number): SelectBuilder<Result> {
		return this.withOption('limit', [limit, offset])
	}

	public lock(type: LockType, modifier?: LockModifier): SelectBuilder<Result> {
		return this.withOption('lock', { type, modifier })
	}

	public meta(key: string, value: any): SelectBuilder<Result>
	public meta(values: Record<string, any>): SelectBuilder<Result>
	public meta(keyOrValues: string | Record<string, any>, value?: any): SelectBuilder<Result> {
		return this.withOption('meta', {
			...this.options.meta,
			...(typeof keyOrValues === 'string' ? { [keyOrValues]: value } : keyOrValues),
		})
	}

	public match(spec: SelectBuilderSpecification): SelectBuilder<Result> {
		return spec(this)
	}

	public async getResult(db: Client): Promise<Result[]> {
		const namespaceContext = new Compiler.Context(db.schema, new Set())
		const query = this.createQuery(namespaceContext)
		const result: Connection.Result = await db.query(query.sql, query.parameters, query.meta)

		return result.rows as any as Result[]
	}

	public createQuery(context: Compiler.Context): Literal {
		const compiler = new Compiler()

		const compiled = compiler.compileSelect(this.options, context)

		return new Literal(compiled.sql, compiled.parameters, this.options.meta)
	}

	protected withOption<K extends keyof SelectBuilder.Options, V extends SelectBuilder.Options[K]>(
		key: K,
		value: V,
	): SelectBuilder<Result> {
		return new SelectBuilder<Result>({ ...this.options, [key]: value })
	}
}

namespace SelectBuilder {
	export type Callback = (qb: SelectBuilder<any>) => SelectBuilder<any>

	export type Result = Record<string, any>

	export type OrderByDirection = 'asc' | 'desc' | 'asc nulls last' | 'asc nulls first' | 'desc nulls first' | 'desc nulls last'
	export const orderByDirection = new Set<OrderByDirection>(['asc', 'desc', 'asc nulls last', 'asc nulls first', 'desc nulls first', 'desc nulls last'])
	export type Options = Readonly<
		With.Options &
		Where.Options & {
			distinct?: Literal[]
			select: Literal[]
			limit: [number | undefined, number | undefined]
			from: undefined | [Literal | string, string | undefined][]
			orderBy: [Literal, OrderByDirection][]
			join: {
				type: 'inner' | 'left'
				table: string | Literal
				alias: string | undefined
				condition: Literal | undefined
			}[]
			grouping: {
				groupingElement: Literal[]
			}
			lock?: { type: LockType; modifier?: LockModifier }
			meta: Record<string, any>
			union?: {
				type: 'all' | 'distinct'
				literal: SubQueryLiteralFactory
			}
		}
	>

	export type JoinCondition = ConditionExpression
}

export { SelectBuilder }
