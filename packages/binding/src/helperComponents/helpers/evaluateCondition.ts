import { GraphQlLiteral, Input } from '@contember/client'
import { FieldValue } from '../../treeParameters'
import { BindingError } from '../../BindingError'

const unwrapGraphqlLiteral = (value: Input.ColumnValue<GraphQlLiteral>): any => {
	if (value instanceof GraphQlLiteral) {
		return value.value
	}
	return value
}

export const evaluateCondition = (value: FieldValue | null, condition: Input.Condition<Input.ColumnValue<GraphQlLiteral>>) => {
		const handlers: {
			[K in keyof Required<Input.Condition<any>>]: (
				param: Exclude<Input.Condition<any>[K], undefined>,
			) => boolean
		} = {
			and: expr => expr.every(it => evaluateCondition(value, it)),
			or: expr => expr.some(it => evaluateCondition(value, it)),
			not: expr => !evaluateCondition(value, expr),
			eq: expr => value === unwrapGraphqlLiteral(expr),
			notEq: expr => value !== unwrapGraphqlLiteral(expr),
			isNull: expr => (value === null) === expr,
			in: expr => expr.map(unwrapGraphqlLiteral).includes(value),
			notIn: expr => !expr.map(unwrapGraphqlLiteral).includes(value),
			lt: expr => value !== null && value < unwrapGraphqlLiteral(expr),
			lte: expr => value !== null && value <= unwrapGraphqlLiteral(expr),
			gt: expr => value !== null && value > unwrapGraphqlLiteral(expr),
			gte: expr => value !== null && value >= unwrapGraphqlLiteral(expr),
			contains: expr => typeof value === 'string' && value.includes(unwrapGraphqlLiteral(expr)),
			startsWith: expr => typeof value === 'string' && value.startsWith(unwrapGraphqlLiteral(expr)),
			endsWith: expr => typeof value === 'string' && value.endsWith(unwrapGraphqlLiteral(expr)),
			containsCI: expr => typeof value === 'string' && value.toLowerCase().includes(unwrapGraphqlLiteral(expr).toLowerCase()),
			startsWithCI: expr => typeof value === 'string' && value.toLowerCase().startsWith(unwrapGraphqlLiteral(expr).toLowerCase()),
			endsWithCI: expr => typeof value === 'string' && value.toLowerCase().endsWith(unwrapGraphqlLiteral(expr).toLowerCase()),
			never: () => false,
			always: () => true,
			// deprecated
			null: expr => (value === null) === expr,
		}
		return Object.entries(condition).every(([operator, argument]) => {
			if (value === undefined) {
				return true
			}
			const handlerKey = operator as keyof typeof handlers
			const handler = handlers[handlerKey]
			if (!handler) {
				throw new BindingError()
			}
			return handler(argument)
		})
	}
