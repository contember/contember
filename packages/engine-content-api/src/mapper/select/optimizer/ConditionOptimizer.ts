import { Input } from '@contember/schema'
import { optimizeAnd, optimizeOr } from './helpers'

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
				} else if (key === 'or' || key === 'and') {
					const parts = (value as readonly Input.Condition[]).map(it => this.optimize(it))
					return key === 'and' ? optimizeAnd(parts) : optimizeOr(parts)

				} else if (key === 'not') {
					const resolved = this.optimize(value as Input.Condition)
					return typeof resolved === 'boolean' ? !resolved : { not: resolved }

				} else {
					return { [key]: value } as Input.Condition
				}
			}),
		)
	}
}
