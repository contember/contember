import { Value } from '../types'
import { Literal } from '../Literal'
import { QueryBuilder } from './QueryBuilder'
import { SelectBuilder } from './SelectBuilder'
import { toFqnWrap } from './formatUtils'
import { Compiler } from './Compiler'
import { createSubQueryLiteralFactory, SubQueryExpression } from './internal/Subqueries'

export type ConditionCallback = (builder: ConditionBuilder) => ConditionBuilder
export type ConditionExpression = ConditionBuilder | ConditionCallback

interface Raw {
	sql: string
	bindings: Value[]
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

	'containsCI' = 'containsCI',
	'startsWithCI' = 'startsWithCI',
	'endsWithCI' = 'endsWithCI',
}

const likeOperators = [
	Operator.contains,
	Operator.containsCI,
	Operator.startsWith,
	Operator.startsWithCI,
	Operator.endsWith,
	Operator.endsWithCI,
]

export class ConditionBuilder {
	private constructor(public readonly expressions: Literal[]) {}

	public static create() {
		return new ConditionBuilder([])
	}

	public static process(condition: ConditionExpression): ConditionBuilder {
		return typeof condition === 'function' ? condition(ConditionBuilder.create()) : condition
	}

	public static not(condition: ConditionExpression): ConditionBuilder {
		return ConditionBuilder.create().not(condition)
	}

	and(condition: ConditionExpression): ConditionBuilder {
		return this.processConditionExpression(ConditionBuilder.process(condition), ['and', false])
	}

	or(condition: ConditionExpression): ConditionBuilder {
		return this.processConditionExpression(ConditionBuilder.process(condition), ['or', false])
	}

	not(condition: ConditionExpression): ConditionBuilder {
		return this.processConditionExpression(ConditionBuilder.process(condition), ['and', true])
	}

	compare(columnName: QueryBuilder.ColumnIdentifier, operator: Operator, value: Value): ConditionBuilder {
		if (!Object.values(Operator).includes(operator)) {
			throw new Error(`Operator ${operator} is not supported`)
		}

		if (likeOperators.includes(operator)) {
			if (typeof value !== 'string') {
				throw new Error(`Operator ${operator} supports only a string value`)
			}
			value = value.replace(/([\\%_])/g, v => '\\' + v)
		}
		return this.with(new Literal(ConditionBuilder.createOperatorSql(toFqnWrap(columnName), '?', operator), [value]))
	}

	columnsEq(columnName1: QueryBuilder.ColumnIdentifier, columnName2: QueryBuilder.ColumnIdentifier): ConditionBuilder {
		return this.compareColumns(columnName1, Operator.eq, columnName2)
	}

	compareColumns(columnName1: QueryBuilder.ColumnIdentifier, operator: Operator, columnName2: QueryBuilder.ColumnIdentifier) {
		return this.with(new Literal(ConditionBuilder.createOperatorSql(toFqnWrap(columnName1), toFqnWrap(columnName2), operator)))
	}

	in(columnName: QueryBuilder.ColumnIdentifier, values: Value[] | SelectBuilder<SelectBuilder.Result>): ConditionBuilder {
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

	exists(subQuery: SubQueryExpression<SelectBuilder>): ConditionBuilder {
		const context = new Compiler.Context(Compiler.SCHEMA_PLACEHOLDER, new Set())
		const query = createSubQueryLiteralFactory<SelectBuilder>(subQuery)(context, subQuery => {
			if (subQuery.options.select.length === 0) {
				return subQuery.select(expr => expr.selectValue(1))
			}
			return subQuery
		})
		return this.with(new Literal(`exists (${query.sql})`, query.parameters))
	}

	isNull(columnName: QueryBuilder.ColumnIdentifier): ConditionBuilder {
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

	isEmpty(): boolean {
		return this.expressions.length === 0
	}

	private processConditionExpression(builder: ConditionBuilder, parameters: ['and' | 'or', boolean]): ConditionBuilder {
		const sql = ConditionBuilder.createLiteral(builder.expressions, ...parameters)
		if (sql) {
			return new ConditionBuilder([...this.expressions, sql])
		}
		return this
	}

	private static createOperatorSql(left: string, right: string, operator: Operator): string {
		if (!Object.values(Operator).includes(operator)) {
			throw new Error(`Operator ${operator} is not supported`)
		}
		switch (operator) {
			case Operator.contains:
				return `${left} LIKE '%' || ${right} || '%'`
			case Operator.containsCI:
				return `${left} ILIKE '%' || ${right} || '%'`
			case Operator.startsWith:
				return `${left} LIKE ${right} || '%'`
			case Operator.startsWithCI:
				return `${left} ILIKE ${right} || '%'`
			case Operator.endsWith:
				return `${left} LIKE '%' || ${right}`
			case Operator.endsWithCI:
				return `${left} ILIKE '%' || ${right}`
		}
		return `${left} ${operator} ${right}`
	}

	private static createLiteral(expressions: Literal[], operator: 'or' | 'and' = 'and', not: boolean = false): Literal | null {
		if (expressions.length === 0) {
			return null
		}
		const sql = expressions.map(it => (it as any as Raw).sql).join(` ${operator} `)

		const bindings: Value[] = []
		expressions.map(it => (it as any as Literal).parameters).forEach(it => bindings.push(...it))

		return new Literal(not ? `not(${sql})` : operator === 'or' ? `(${sql})` : sql, bindings)
	}
}
