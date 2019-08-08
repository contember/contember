import { Value } from './types'
import QueryBuilder from './QueryBuilder'
import SelectBuilder from './SelectBuilder'
import Literal from './Literal'

type ConditionBuilderCallback = (builder: ConditionBuilder) => void

interface Raw {
	sql: string
	bindings: Value[]
}

class ConditionBuilder {
	public readonly expressions: Literal[] = []

	and(callback: ConditionBuilderCallback): void {
		this.invokeCallback(callback, ['and', false])
	}

	or(callback: ConditionBuilderCallback): void {
		this.invokeCallback(callback, ['or', false])
	}

	not(callback: ConditionBuilderCallback): void {
		this.invokeCallback(callback, ['and', true])
	}

	private invokeCallback(callback: ConditionBuilderCallback, parameters: ['and' | 'or', boolean]) {
		const builder = new ConditionBuilder()
		callback(builder)
		const sql = builder.getSql(...parameters)
		if (sql) {
			this.expressions.push(sql)
		}
	}

	compare(columnName: QueryBuilder.ColumnIdentifier, operator: ConditionBuilder.Operator, value: Value): void {
		if (!Object.values(ConditionBuilder.Operator).includes(operator)) {
			throw new Error(`Operator ${operator} is not supported`)
		}
		this.expressions.push(new Literal(`${QueryBuilder.toFqnWrap(columnName)} ${operator} ?`, [value]))
	}

	compareColumns(
		columnName1: QueryBuilder.ColumnIdentifier,
		operator: ConditionBuilder.Operator,
		columnName2: QueryBuilder.ColumnIdentifier,
	) {
		if (!Object.values(ConditionBuilder.Operator).includes(operator)) {
			throw new Error(`Operator ${operator} is not supported`)
		}
		this.expressions.push(
			new Literal(`${QueryBuilder.toFqnWrap(columnName1)} ${operator} ${QueryBuilder.toFqnWrap(columnName2)}`),
		)
	}

	in<Filled extends keyof SelectBuilder.Options>(
		columnName: QueryBuilder.ColumnIdentifier,
		values: Value[] | SelectBuilder<SelectBuilder.Result, Filled>,
	): void {
		if (!Array.isArray(values)) {
			const query = values.createQuery()
			this.expressions.push(new Literal(`${QueryBuilder.toFqnWrap(columnName)} in (${query.sql})`, query.parameters))
			return
		}
		values = values.filter(it => it !== undefined)
		if (values.length > 0) {
			const parameters = values.map(() => '?').join(', ')
			this.expressions.push(new Literal(`${QueryBuilder.toFqnWrap(columnName)} in (${parameters})`, values))
		} else {
			this.raw('false')
		}
	}

	null(columnName: QueryBuilder.ColumnIdentifier): void {
		this.expressions.push(new Literal(`${QueryBuilder.toFqnWrap(columnName)} is null`))
	}

	raw(sql: string, ...bindings: (Value)[]): void {
		this.expressions.push(new Literal(sql, bindings))
	}

	public getSql(operator: 'or' | 'and' = 'and', not: boolean = false): Literal | null {
		if (this.expressions.length === 0) {
			return null
		}
		const sql = this.expressions.map(it => ((it as any) as Raw).sql).join(` ${operator} `)

		const bindings: Value[] = []
		this.expressions.map(it => ((it as any) as Literal).parameters).forEach(it => bindings.push(...it))

		return new Literal(not ? `not(${sql})` : operator === 'or' ? `(${sql})` : sql, bindings)
	}

	isEmpty(): boolean {
		return this.expressions.length === 0
	}
}

namespace ConditionBuilder {
	export enum Operator {
		'notEq' = '!=',
		'eq' = '=',
		'gt' = '>',
		'gte' = '>=',
		'lt' = '<',
		'lte' = '<=',
	}
}

export default ConditionBuilder
