import { Input, Value } from '@contember/schema'

export type ConditionTupleQ<T = Value.FieldValue, S extends keyof Input.Condition<T> = keyof Input.Condition<T>> = Exclude<{ [K in S ]: [K, Exclude<Input.Condition<T>[K], undefined>] }[S], undefined>
export type ConditionTuple<T = Value.FieldValue> = ConditionTupleQ<T> | [null, null]
export type ConditionTupleItem<T = Value.FieldValue> = ConditionTupleQ<T, Exclude<keyof Input.Condition<T>, 'always' | 'never'>>

export class ConditionOptimizer {
	public optimize(condition: Input.Condition): Input.Condition | boolean {
		return this.fromTuple(this.optimizeTuple(this.toTuple(condition)))
	}

	private toTuple(condition: Input.Condition): ConditionTuple {
		const entries = Object.entries(condition)

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

		if (key === null) {
			return condition

		} else if (key === 'and') {
			const subItems: ConditionTuple[] = []
			let hasAlways = false

			for (const subItem of value.map(subCondition => this.optimizeTuple(this.toTuple(subCondition)))) {
				const [subKey, subValue] = subItem

				if (subKey === null) {
					continue

				} else if (subKey === 'never') {
					return subItem

				} else if (subKey === 'always') {
					hasAlways = true

				} else if (subKey === 'and') {
					subItems.push(...subValue.map(subCondition => this.toTuple(subCondition)).filter(subItem => subItem[0] !== null))

				} else {
					subItems.push(subItem)
				}
			}

			if (subItems.length > 1) {
				return ['and', subItems.map(([key, value]) => ({ [key]: value }))]

			} else if (subItems.length === 1) {
				return subItems[0]

			} else if (hasAlways) {
				return ['always', true]

			} else {
				return [null, null]
			}

		} else if (key === 'or') {
			const subItems: ConditionTuple[] = []
			for (const subItem of value.map(subCondition => this.optimizeTuple(this.toTuple(subCondition)))) {
				const [subKey, subValue] = subItem

				if (subKey === null) {
					continue

				} else if (subKey === 'always') {
					return subItem

				} else if (subKey === 'or') {
					subItems.push(...subValue.map(subCondition => this.toTuple(subCondition)) as ConditionTuple[])

				} else if (subKey !== 'never') {
					subItems.push(subItem)
				}
			}

			return subItems.length > 1
				? ['or', subItems.map(([key, value]) => ({ [key]: value }))]
				: subItems.length === 1
					? subItems[0]
					: [null, null]

		} else if (key === 'not') {
			const subItem = this.optimizeTuple(this.toTuple(value))

			if (subItem === null) {
				return [null, null]

			} else if (subItem[0] === 'always') {
				return ['never', true]

			} else if (subItem[0] === 'never') {
				return ['always', true]

			} else {
				return ['not', { [subItem[0]]: subItem[1] }]
			}

		} else {
			return condition
		}
	}
}
