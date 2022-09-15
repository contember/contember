import { Input, Model, Writable } from '@contember/schema'
import { replaceWhere } from '../mapper/select/optimizer/WhereReplacer'

export class EvaluatedPredicateReplacer {
	constructor(
		private readonly evaluatedPredicate: Input.OptionalWhere,
		private readonly sourceEntity: Model.Entity,
		private readonly relation: Model.AnyRelation,
	) {
	}

	public replace(where: Input.OptionalWhere): Input.OptionalWhere {
		const result: Writable<Input.OptionalWhere> = {}
		for (const [key, value] of Object.entries(where)) {
			if (key === 'not') {
				result['not'] = this.replace(value as Input.OptionalWhere)

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
