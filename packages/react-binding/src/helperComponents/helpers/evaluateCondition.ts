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
		similar: expr => {
			if (typeof value !== 'string') return false
			const trigrams = (s: string): Set<string> => {
				const lower = s.toLowerCase()
				const padded = `  ${lower} `
				const set = new Set<string>()
				for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3))
				return set
			}
			const a = trigrams(value)
			const b = trigrams(expr)
			const intersection = [...a].filter(t => b.has(t)).length
			const union = new Set([...a, ...b]).size
			return union > 0 && intersection / union >= 0.3
		},
		wordSimilar: expr => {
			if (typeof value !== 'string') return false
			const trigrams = (s: string): Set<string> => {
				const lower = s.toLowerCase()
				const padded = `  ${lower} `
				const set = new Set<string>()
				for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3))
				return set
			}
			const queryTrigrams = trigrams(expr)
			const words = value.toLowerCase().split(/\s+/)
			return words.some(word => {
				const wordTrigrams = trigrams(word)
				const intersection = [...queryTrigrams].filter(t => wordTrigrams.has(t)).length
				const union = new Set([...queryTrigrams, ...wordTrigrams]).size
				return union > 0 && intersection / union >= 0.6
			})
		},
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
