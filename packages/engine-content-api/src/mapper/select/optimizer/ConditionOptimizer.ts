import { Input } from '@contember/schema'
import { optimizeAnd, optimizeNot, optimizeOr } from './helpers'

export class ConditionOptimizer {
	public optimize(condition: Input.Condition): Input.Condition | boolean {
		if (condition.never) {
			return false
		}

		return optimizeAnd(
			Object.entries(condition).map(([key, value]) => {
				if (value === undefined || value === null) {
					return undefined

				} else if (key === 'always') {
					return true

				} else if (key === 'and') {
					return optimizeAnd((value as readonly Input.Condition[]).map(it => this.optimize(it)))

				} else if (key === 'or') {
					return optimizeOr((value as readonly Input.Condition[]).map(it => this.optimize(it)))

				} else if (key === 'not') {
					return optimizeNot(this.optimize(value as Input.Condition))

				} else {
					return { [key]: value } as Input.Condition
				}
			}),
		)
	}
}
