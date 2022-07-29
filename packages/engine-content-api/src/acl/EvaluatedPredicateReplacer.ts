import { Input, Model, Writable } from '@contember/schema'
import deepEqual from 'fast-deep-equal'

export class EvaluatedPredicateReplacer {
	constructor(
		private readonly evaluatedPredicate: Input.Where,
		private readonly sourceEntity: Model.Entity,
		private readonly relation: Model.AnyRelation,
	) {
	}

	public replace(where: Input.Where): Input.Where {
		return this.replaceInternal(where, false)
	}

	private replaceInternal(where: Input.Where, onRelation: boolean): Input.Where {
		if (onRelation && deepEqual(where, this.evaluatedPredicate)) {
			return { [this.sourceEntity.primary]: { always: true } }
		}
		const result: Writable<Input.Where> = {}
		for (const [key, value] of Object.entries(where)) {
			if (key === 'not') {
				result['not'] = this.replaceInternal(value as Input.Where, onRelation)

			} else if (key === 'and' || key === 'or') {
				const parts = []
				for (const sub of value as Input.Where[]) {
					parts.push(this.replaceInternal(sub, onRelation))
				}
				result[key] = parts

			} else if (key === this.relation.name) {
				result[key] = this.replaceInternal(value as Input.Where, true)

			} else {
				result[key] = value
			}

		}
		return result
	}
}
