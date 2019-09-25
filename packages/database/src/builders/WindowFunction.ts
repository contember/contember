import { QueryBuilder } from './QueryBuilder'
import { Literal } from '../Literal'
import { columnExpressionToLiteral, toFqnWrap } from './utils'

class WindowFunction<HasFunction extends boolean> implements QueryBuilder.Orderable<WindowFunction<HasFunction>> {
	private constructor(
		private readonly windowFunction: Literal | undefined,
		private readonly partitionByExpr: Literal | undefined,
		private readonly orderByColumns: Literal[],
	) {}

	public static createEmpty(): WindowFunction<false> {
		return new WindowFunction<false>(undefined, undefined, [])
	}

	public rowNumber(): WindowFunction<true> {
		return new WindowFunction(new Literal('row_number()'), this.partitionByExpr, this.orderByColumns)
	}

	public partitionBy(columnName: QueryBuilder.ColumnIdentifier): WindowFunction<HasFunction>
	public partitionBy(callback: QueryBuilder.ColumnExpression): WindowFunction<HasFunction>
	public partitionBy(expr: QueryBuilder.ColumnIdentifier | QueryBuilder.ColumnExpression): WindowFunction<HasFunction> {
		const raw = columnExpressionToLiteral(expr)
		if (raw === undefined) {
			return this
		}
		return new WindowFunction(this.windowFunction, raw, this.orderByColumns)
	}

	orderBy(columnName: QueryBuilder.ColumnIdentifier, direction: 'asc' | 'desc' = 'asc'): WindowFunction<HasFunction> {
		const raw = new Literal(toFqnWrap(columnName) + (direction === 'asc' ? ' asc' : ' desc'))
		return new WindowFunction(this.windowFunction, this.partitionByExpr, [...this.orderByColumns, raw])
	}

	compile(): Literal {
		if (this.windowFunction === undefined) {
			throw new Error()
		}
		let windowDefinition = new Literal('')
		if (this.partitionByExpr !== undefined) {
			windowDefinition = windowDefinition.appendString('partition by ').append(this.partitionByExpr)
		}
		if (this.orderByColumns.length > 0) {
			windowDefinition = windowDefinition.appendString(' order by ').appendAll(this.orderByColumns, ', ')
		}
		return new Literal(this.windowFunction.sql + ' over(' + windowDefinition.sql + ')', [
			...this.windowFunction.parameters,
			...windowDefinition.parameters,
		])
	}
}

export { WindowFunction }
