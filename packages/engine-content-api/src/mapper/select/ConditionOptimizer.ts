import { Input } from '@contember/schema'
import { ConditionOptimizationHelper } from './ConditionOptimizationHelper'

export class ConditionOptimizer {
	public optimize(condition: Input.Condition): Input.Condition | boolean {
		const result = this.optimizeCondition(condition)
		if (result === false) {
			return false
		} else if (result === true) {
			return true
		}
		if (result.length === 0) {
			return true
		}
		return result.length === 1 ? result[0] : { and: result }
	}

	private optimizeCondition(condition: Input.Condition): Input.Condition[] | boolean {
		if (condition.never) {
			return false
		}

		const resultCondition: Input.Condition[] = []
		for (const [key, value] of Object.entries(condition)) {
			if (value === undefined || value === null || key === 'always') {
				continue
			}

			if (key === 'or' || key === 'and') {
				const resolved = this[key === 'or' ? 'optimizeConditionOr' : 'optimizeConditionAnd'](value as readonly Input.Condition[])
				if (resolved === false) {
					return false
				}
				if (resolved === true) {
					continue
				}
				if (key === 'and') {
					resultCondition.push(...resolved)
				} else {
					if (resolved.length === 1) {
						resultCondition.push(resolved[0])
					} else if (resolved.length > 1) {
						resultCondition.push({ or: resolved })
					}
				}
			} else if (key === 'not') {
				const resolved = this.optimizeCondition(value as Input.Condition)
				if (resolved === true) {
					return false
				}
				if (resolved === false) {
					continue
				}
				if (resolved.length > 0) {
					resultCondition.push({ not: resolved.length === 1 ? resolved[0] : { and: resolved } })
				}
			} else {
				resultCondition.push({ [key]: value })
			}
		}
		if (resultCondition.length === 0 && condition.always) {
			return true
		}
		return resultCondition
	}

	private optimizeConditionOr(parts: readonly Input.Condition[]): Input.Condition[] | boolean {
		return ConditionOptimizationHelper.optimizeOr(parts.map(it => this.optimizeCondition(it)))
	}

	private optimizeConditionAnd(parts: readonly Input.Condition[]): Input.Condition[] | boolean {
		return ConditionOptimizationHelper.optimizeAnd(parts.map(it => this.optimizeCondition(it)))
	}
}
