import { Value } from '../types'
import { Literal } from '../Literal'
import { QueryBuilder } from './QueryBuilder'
import { SelectBuilder } from './SelectBuilder'
import { toFqnWrap } from './formatUtils'
import { Compiler } from './Compiler'

export type ConditionCallback = (builder: ConditionBuilder) => ConditionBuilder

interface Raw {
	sql: string
	bindings: Value[]
}

export class ConditionBuilder {
	private constructor(public readonly expressions: Literal[]) {}

	public static create() {
		return new ConditionBuilder([])
	}

	public static invoke(cb: ConditionCallback): ConditionBuilder {
		return cb(ConditionBuilder.create())
	}

	and(callback: ConditionCallback): ConditionBuilder {
		return this.invokeCallback(callback, ['and', false])
	}

	or(callback: ConditionCallback): ConditionBuilder {
		return this.invokeCallback(callback, ['or', false])
	}

	not(callback: ConditionCallback): ConditionBuilder {
		return this.invokeCallback(callback, ['and', true])
	}

	private invokeCallback(callback: ConditionCallback, parameters: ['and' | 'or', boolean]): ConditionBuilder {
		const builder = callback(ConditionBuilder.create())
		const sql = ConditionBuilder.createLiteral(builder.expressions, ...parameters)
		if (sql) {
			return new ConditionBuilder([...this.expressions, sql])
		}
		return this
	}

	compare(columnName: QueryBuilder.ColumnIdentifier, operator: Operator, value: Value): ConditionBuilder {
		if (!Object.values(Operator).includes(operator)) {
			throw new Error(`Operator ${operator} is not supported`)
		}
		if (operator === Operator.contains || operator === Operator.endsWith || operator === Operator.startsWith) {
			if (typeof value !== 'string') {
				throw new Error(`Operator ${operator} supports only a string value`)
			}
			value = value.replace(/([\\%_])/g, v => '\\' + v)
		}
		return this.with(new Literal(this.createOperatorSql(toFqnWrap(columnName), '?', operator), [value]))
	}

	columnsEq(columnName1: QueryBuilder.ColumnIdentifier, columnName2: QueryBuilder.ColumnIdentifier): ConditionBuilder {
		return this.compareColumns(columnName1, Operator.eq, columnName2)
	}

	compareColumns(
		columnName1: QueryBuilder.ColumnIdentifier,
		operator: Operator,
		columnName2: QueryBuilder.ColumnIdentifier,
	) {
		return this.with(new Literal(this.createOperatorSql(toFqnWrap(columnName1), toFqnWrap(columnName2), operator)))
	}

	private createOperatorSql(left: string, right: string, operator: Operator): string {
		if (!Object.values(Operator).includes(operator)) {
			throw new Error(`Operator ${operator} is not supported`)
		}
		switch (operator) {
			case Operator.contains:
				return `${left} LIKE '%' || ${right} || '%'`
			case Operator.startsWith:
				return `${left} LIKE ${right} || '%'`
			case Operator.endsWith:
				return `${left} LIKE '%' || ${right}`
		}
		return `${left} ${operator} ${right}`
	}

	in(
		columnName: QueryBuilder.ColumnIdentifier,
		values: Value[] | SelectBuilder<SelectBuilder.Result>,
	): ConditionBuilder {
		if (!Array.isArray(values)) {
			// todo: replace placeholder with some kind of callback
			const query = values.createQuery(new Compiler.Context(Compiler.SCHEMA_PLACEHOLDER, new Set()))
			return this.with(new Literal(`${toFqnWrap(columnName)} in (${query.sql})`, query.parameters))
		}
		values = values.filter(it => it !== undefined)
		if (values.length > 0) {
			const parameters = values.map(() => '?').join(', ')
			return this.with(new Literal(`${toFqnWrap(columnName)} in (${parameters})`, values))
		}
		return this.raw('false')
	}

	null(columnName: QueryBuilder.ColumnIdentifier): ConditionBuilder {
		return this.with(new Literal(`${toFqnWrap(columnName)} is null`))
	}

	raw(sql: string, ...bindings: Value[]): ConditionBuilder {
		return this.with(new Literal(sql, bindings))
	}

	with(expression?: Literal | null | undefined): ConditionBuilder {
		if (!expression) {
			return this
		}
		return new ConditionBuilder([...this.expressions, expression])
	}

	public getSql(): Literal | null {
		return ConditionBuilder.createLiteral(this.expressions)
	}

	private static createLiteral(
		expressions: Literal[],
		operator: 'or' | 'and' = 'and',
		not: boolean = false,
	): Literal | null {
		if (expressions.length === 0) {
			return null
		}
		const sql = expressions.map(it => ((it as any) as Raw).sql).join(` ${operator} `)

		const bindings: Value[] = []
		expressions.map(it => ((it as any) as Literal).parameters).forEach(it => bindings.push(...it))

		return new Literal(not ? `not(${sql})` : operator === 'or' ? `(${sql})` : sql, bindings)
	}

	isEmpty(): boolean {
		return this.expressions.length === 0
	}
}

export enum Operator {
	'notEq' = '!=',
	'eq' = '=',
	'gt' = '>',
	'gte' = '>=',
	'lt' = '<',
	'lte' = '<=',
	'contains' = 'contains',
	'startsWith' = 'startsWith',
	'endsWith' = 'endsWith',
}
