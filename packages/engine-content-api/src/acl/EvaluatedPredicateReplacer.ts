import { Input, Model, Writable } from '@contember/schema'
import { replaceWhere } from '../mapper/select/optimizer/WhereReplacer'

export class EvaluatedPredicateReplacer {
	constructor(
		private readonly evaluatedPredicate: Input.Where,
		private readonly sourceEntity: Model.Entity,
		private readonly relation: Model.AnyRelation,
	) {
	}

	public replace(where: Input.Where): Input.Where {
		const result: Writable<Input.Where> = {}
		for (const [key, value] of Object.entries(where)) {
			if (key === 'not') {
				result['not'] = this.replace(value as Input.Where)

			} else if (key === 'and' || key === 'or') {
				result[key] = (value as Input.Where[]).map(it => this.replace(it))

			} else if (key === this.relation.name) {
				result[key] = replaceWhere(value as Input.Where, this.evaluatedPredicate, { [this.sourceEntity.primary]: { always: true } })

			} else {
				result[key] = value
			}

		}
		return result
	}

}
