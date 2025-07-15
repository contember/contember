import { Input } from '@contember/client'
import { FieldValue } from '@contember/binding'
import { BindingError } from '@contember/binding'

export const evaluateCondition = (value: FieldValue | null, condition: Input.Condition<Input.ColumnValue>) => {
	const handlers: {
		[K in keyof Required<Input.Condition<any>>]: (
			param: Exclude<Input.Condition<any>[K], undefined>,
		) => boolean
	} = {
		and: expr => expr.every(it => evaluateCondition(value, it)),
		or: expr => expr.some(it => evaluateCondition(value, it)),
		not: expr => !evaluateCondition(value, expr),
		eq: expr => value === expr,
		notEq: expr => value !== expr,
		isNull: expr => (value === null) === expr,
		in: expr => expr.includes(value),
		notIn: expr => !expr.includes(value),
		lt: expr => value !== null && value < expr,
		lte: expr => value !== null && value <= expr,
		gt: expr => value !== null && value > expr,
		gte: expr => value !== null && value >= expr,
		includes: (expr: any) => Array.isArray(value) && value.includes(expr),
		maxLength: expr => Array.isArray(value) && value.length <= expr,
		minLength: expr => Array.isArray(value) && value.length >= expr,
		contains: expr => typeof value === 'string' && value.includes(expr),
		startsWith: expr => typeof value === 'string' && value.startsWith(expr),
		endsWith: expr => typeof value === 'string' && value.endsWith(expr),
		containsCI: expr => typeof value === 'string' && value.toLowerCase().includes(expr.toLowerCase()),
		startsWithCI: expr => typeof value === 'string' && value.toLowerCase().startsWith(expr.toLowerCase()),
		endsWithCI: expr => typeof value === 'string' && value.toLowerCase().endsWith(expr.toLowerCase()),
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
		return (handler as any)(argument)
	})
}
