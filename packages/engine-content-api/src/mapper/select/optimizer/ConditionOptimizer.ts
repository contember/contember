import { Input } from '@contember/schema'
import { optimizeJunction, ResultCollector } from './helpers'


export class ConditionOptimizer {
	public optimize(condition: Input.Condition): Input.Condition | boolean {
		const result = this.optimizeCondition(condition)
		if (typeof result === 'boolean') {
			return result
		}
		return result.length > 1 ? { and: result } : (result?.[0] ?? {})
	}

	private optimizeCondition(condition: Input.Condition): Input.Condition[] | boolean {
		if (condition.never) {
			return false
		}

		const resultCollector = new ResultCollector<Input.Condition>(true)

		for (const [key, value] of Object.entries(condition)) {
			if (value === undefined || value === null) {
				// do nothing
			} else if (key === 'always') {
				resultCollector.add(true)
			} else if (key === 'or' || key === 'and') {
				const parts = (value as readonly Input.Condition[]).filter(it => !!it).map(it => this.optimizeCondition(it))
				resultCollector.add(optimizeJunction(key, parts), key)
			} else if (key === 'not') {
				const resolved = this.optimizeCondition(value as Input.Condition)
				resultCollector.add(resolved, 'not')
			} else {
				resultCollector.add([{ [key]: value } as Input.Condition])
			}
		}

		return resultCollector.getResult()
	}
}
