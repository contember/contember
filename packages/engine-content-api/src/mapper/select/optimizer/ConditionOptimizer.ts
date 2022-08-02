import { Input, Value } from '@contember/schema'

export type ConditionTupleBase<T = Value.FieldValue, S extends keyof Input.Condition<T> = keyof Input.Condition<T>> = Exclude<{ [K in S ]: [K, Exclude<Input.Condition<T>[K], undefined>] }[S], undefined>
export type ConditionTuple<T = Value.FieldValue> = ConditionTupleBase<T> | [null, null]
export type ConditionTupleItem<T = Value.FieldValue> = ConditionTupleBase<T, Exclude<keyof Input.Condition<T>, 'always' | 'never'>>

export class ConditionOptimizer {
	public optimize(condition: Input.Condition): Input.Condition | boolean {
		return this.fromTuple(this.optimizeTuple(this.toTuple(condition)))
	}

	private toTuple(condition: Input.Condition): ConditionTuple {
		const entries = Object.entries(condition).filter(([k, v]) => v !== undefined && v !== null)

		if (entries.length === 0) {
			return [null, null]
		} else if (entries.length === 1) {
			return entries[0] as ConditionTuple
		} else {
			return ['and', entries.map(([key, value]) => ({ [key]: value }))]
		}
	}

	private fromTuple([key, value]: ConditionTuple): Input.Condition | boolean {
		if (key === null) {
			return {}
		} else if (key === 'always') {
			return true
		} else if (key === 'never') {
			return false
		} else {
			return { [key]: value }
		}
	}

	private optimizeTuple(condition: ConditionTuple): ConditionTuple {
		const [key, value] = condition

		if (key === 'and') {
			return this.optimizeAnd(value.map(item => this.optimizeTuple(this.toTuple(item))))
		} else if (key === 'or') {
			return this.optimizeOr(value.map(item => this.optimizeTuple(this.toTuple(item))))
		} else if (key === 'not') {
			return this.optimizeNot(this.optimizeTuple(this.toTuple(value)))
		} else {
			return condition
		}
	}

	private optimizeAnd(items: ConditionTuple[]): ConditionTuple {
		return this.optimizeJunction(items, 'and', 'never', ['always', true])
	}

	private optimizeOr(items: ConditionTuple[]): ConditionTuple {
		return this.optimizeJunction(items, 'or', 'always')
	}

	private optimizeJunction(items: ConditionTuple[], key: 'and' | 'or', shortCircuiting: 'always' | 'never', emptyFallback?: ConditionTuple): ConditionTuple {
		const resolved: ConditionTupleItem[] = []

		for (const item of items) {
			const [subKey, subValue] = item

			if (subKey === shortCircuiting) {
				return item
			} else if (subKey === key) {
				resolved.push(...subValue.map(subCondition => this.toTuple(subCondition) as ConditionTupleItem))
			} else if (subKey !== null && subKey !== 'always' && subKey !== 'never') {
				resolved.push(item)
			}
		}

		if (resolved.length > 1) {
			return [key, resolved.map(([key, value]) => ({ [key]: value }))]
		} else if (resolved.length === 1) {
			return resolved[0]
		} else if (emptyFallback && items.length > 0) {
			return emptyFallback
		} else {
			return [null, null]
		}
	}

	private optimizeNot([key, value]: ConditionTuple): ConditionTuple {
		if (key === null) {
			return [null, null]
		} else if (key === 'always') {
			return ['never', true]
		} else if (key === 'never') {
			return ['always', true]
		} else {
			return ['not', { [key]: value }]
		}
	}
}
