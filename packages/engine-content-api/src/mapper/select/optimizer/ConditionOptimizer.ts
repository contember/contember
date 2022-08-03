import { Input } from '@contember/schema'
import { optimizeAnd, optimizeNot, optimizeOr } from './helpers'

type ObjectEntry<T> = { [K in keyof Required<T>]: [K, T[K]] }[keyof T]

export class ConditionOptimizer {
	public optimize(condition: Input.Condition): Omit<Input.Condition, 'always' | 'never'> | boolean {
		if (condition.never) {
			return false
		}

		return optimizeAnd(
			(Object.entries(condition) as ObjectEntry<typeof condition>[]).map(([key, value]) => {
				if (value === undefined || value === null) {
					return undefined

				} else if (key === 'always') {
					return true

				} else if (key === 'and') {
					return optimizeAnd(value.map(it => this.optimize(it)))

				} else if (key === 'or') {
					return optimizeOr(value.map(it => this.optimize(it)))

				} else if (key === 'not') {
					return optimizeNot(this.optimize(value))

				} else {
					return { [key]: value }
				}
			}),
		)
	}
}
