import { QueryBuilder } from './QueryBuilder'
import { Literal } from '../Literal'
import { Value } from '../types'
import { ConditionBuilder, ConditionCallback, ConditionExpression } from './ConditionBuilder'
import { WindowFunction } from './WindowFunction'
import { CaseStatement } from './CaseStatement'
import { toFqnWrap } from './formatUtils'

export class ColumnExpressionFactory {
	constructor() {}

	public select(columnName: QueryBuilder.ColumnIdentifier): Literal {
		return new Literal(toFqnWrap(columnName))
	}

	public selectValue(value: Value, type?: string): Literal {
		const sql = '?' + (type ? ` :: ${type}` : '')
		return new Literal(sql, [value])
	}

	public selectCondition(condition: ConditionExpression): Literal | undefined {
		const builder = ConditionBuilder.process(condition)
		return builder.getSql() || undefined
	}

	public raw(sql: string, ...bindings: Value[]): Literal {
		return new Literal(sql, bindings)
	}

	public window(callback: (windowFunction: WindowFunction<false>) => WindowFunction<true>): Literal {
		return callback(WindowFunction.createEmpty()).compile()
	}

	public case(callback: (caseStatement: CaseStatement) => CaseStatement): Literal {
		return callback(CaseStatement.createEmpty()).compile()
	}
}
