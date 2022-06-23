import { QueryBuilder } from './QueryBuilder.js'
import { Literal } from '../Literal.js'
import { columnExpressionToLiteral, toFqnWrap } from './utils.js'

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

	orderBy(
		expression: QueryBuilder.ColumnIdentifier | Literal,
		direction: 'asc' | 'desc' = 'asc',
	): WindowFunction<HasFunction> {
		const raw = expression instanceof Literal ? expression : new Literal(toFqnWrap(expression))
		return new WindowFunction(this.windowFunction, this.partitionByExpr, [
			...this.orderByColumns,
			raw.appendString(direction === 'asc' ? ' asc' : ' desc'),
		])
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
