import QueryBuilder from './QueryBuilder'
import * as Knex from 'knex'
import KnexWrapper from './KnexWrapper'

class WindowFunction<HasFunction extends boolean> implements QueryBuilder.Orderable {
	private constructor(
		private readonly wrapper: KnexWrapper,
		private readonly windowFunction: Knex.Raw | undefined,
		private readonly partitionByExpr: Knex.Raw | undefined,
		private readonly orderByColumns: Knex.Raw[]
	) {}

	public static createEmpty(wrapper: KnexWrapper): WindowFunction<false> {
		return new WindowFunction<false>(wrapper, undefined, undefined, [])
	}

	public rowNumber(): WindowFunction<true> {
		return new WindowFunction(this.wrapper, this.wrapper.raw('row_number()'), this.partitionByExpr, this.orderByColumns)
	}

	public partitionBy(columnName: QueryBuilder.ColumnIdentifier): WindowFunction<HasFunction>
	public partitionBy(callback: QueryBuilder.ColumnExpression): WindowFunction<HasFunction>
	public partitionBy(expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression): WindowFunction<HasFunction> {
		const raw = QueryBuilder.columnExpressionToRaw(this.wrapper, expr)
		if (raw === undefined) {
			return this
		}
		return new WindowFunction(this.wrapper, this.windowFunction, raw, this.orderByColumns)
	}

	orderBy(columnName: QueryBuilder.ColumnIdentifier, direction: 'asc' | 'desc' = 'asc'): WindowFunction<HasFunction> {
		const raw = this.wrapper.raw('?? ' + (direction === 'asc' ? 'asc' : 'desc'), QueryBuilder.toFqn(columnName))
		return new WindowFunction(this.wrapper, this.windowFunction, this.partitionByExpr, [...this.orderByColumns, raw])
	}

	buildRaw(): Knex.Raw {
		if (this.windowFunction === undefined) {
			throw new Error()
		}
		const bindings: Knex.Raw[] = []
		bindings.push(this.windowFunction)

		let windowDefinition = ''
		if (this.partitionByExpr !== undefined) {
			windowDefinition += ' partition by ?? '
			bindings.push(this.partitionByExpr)
		}
		if (this.orderByColumns.length > 0) {
			windowDefinition += ' order by ' + this.orderByColumns.map(() => '??').join(', ')
			bindings.push(...this.orderByColumns)
		}

		return this.wrapper.raw(`?? over(${windowDefinition})`, ...bindings)
	}
}

namespace WindowFunction {
	export class MutableWindowFunctionOrderableWrapper implements QueryBuilder.Orderable {
		constructor(private windowFunction: WindowFunction<any>) {}

		getWindowFunction(): WindowFunction<any> {
			return this.windowFunction
		}

		orderBy(columnName: QueryBuilder.ColumnIdentifier, direction: 'asc' | 'desc' = 'asc'): void {
			this.windowFunction = this.windowFunction.orderBy(columnName, direction)
		}
	}
}

export default WindowFunction
