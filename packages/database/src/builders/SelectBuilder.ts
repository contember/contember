import { With } from './internal/With'
import { Where } from './internal/Where'
import { aliasLiteral } from '../utils'
import { Compiler } from './Compiler'
import { QueryBuilder } from './QueryBuilder'
import { Client, Connection } from '../client'
import { Literal } from '../Literal'
import { ConditionBuilder, ConditionCallback } from './ConditionBuilder'
import { LockType } from './LockType'
import { columnExpressionToLiteral, toFqnWrap } from './utils'
import { createSubQueryLiteralFactory, SubQueryExpression, SubQueryLiteralFactory } from './internal/Subqueries'

export type SelectBuilderSpecification = <Result>(qb: SelectBuilder<Result>) => SelectBuilder<Result>

class SelectBuilder<Result = SelectBuilder.Result>
	implements With.Aware, Where.Aware, QueryBuilder.Orderable<SelectBuilder<Result>>, QueryBuilder {
	constructor(public readonly options: SelectBuilder.Options) {}

	public static create<Result = SelectBuilder.Result>() {
		return new SelectBuilder<Result>({
			from: undefined,
			orderBy: [],
			join: [],
			limit: undefined,
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

	public from(tableName: string | Literal, alias?: string): SelectBuilder<Result> {
		return this.withOption('from', [...(this.options.from || []), [tableName, alias]])
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

	public orderBy(columnName: QueryBuilder.ColumnIdentifier, direction: 'asc' | 'desc' = 'asc'): SelectBuilder<Result> {
		return this.withOption('orderBy', [...this.options.orderBy, [new Literal(toFqnWrap(columnName)), direction]])
	}

	public join(table: string, alias?: string, condition?: SelectBuilder.JoinCondition): SelectBuilder<Result> {
		return this.withOption('join', [
			...this.options.join,
			{ type: 'inner', table, alias, condition: this.joinConditionToLiteral(condition) },
		])
	}

	public leftJoin(table: string, alias?: string, condition?: SelectBuilder.JoinCondition): SelectBuilder<Result> {
		return this.withOption('join', [
			...this.options.join,
			{ type: 'left', table, alias, condition: this.joinConditionToLiteral(condition) },
		])
	}

	private joinConditionToLiteral(joinCondition?: SelectBuilder.JoinCondition): Literal | undefined {
		if (joinCondition === undefined) {
			return undefined
		}
		const builder = ConditionBuilder.invoke(joinCondition)

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

	public limit(limit: number, offset?: number): SelectBuilder<Result> {
		return this.withOption('limit', [limit, offset || 0])
	}

	public lock(type: LockType): SelectBuilder<Result> {
		return this.withOption('lock', type)
	}

	public meta(key: string, value: any): SelectBuilder<Result> {
		return this.withOption('meta', { ...this.options.meta, [key]: value })
	}

	public match(spec: SelectBuilderSpecification): SelectBuilder<Result> {
		return spec(this)
	}

	public async getResult(db: Client): Promise<Result[]> {
		const namespaceContext = new Compiler.Context(db.schema, new Set())
		const query = this.createQuery(namespaceContext)
		const result: Connection.Result = await db.query(query.sql, query.parameters, query.meta)

		return (result.rows as any) as Result[]
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

	export type Result = { [columnName: string]: any }

	export type Options = Readonly<
		With.Options &
			Where.Options & {
				select: Literal[]
				limit: undefined | [number, number]
				from: undefined | [Literal | string, string | undefined][]
				orderBy: [Literal, 'asc' | 'desc'][]
				join: {
					type: 'inner' | 'left'
					table: string
					alias: string | undefined
					condition: Literal | undefined
				}[]
				grouping: {
					groupingElement: Literal[]
				}
				lock?: LockType
				meta: Record<string, any>
				union?: {
					type: 'all' | 'distinct'
					literal: SubQueryLiteralFactory
				}
			}
	>

	export type JoinCondition = ConditionCallback
}

export { SelectBuilder }
