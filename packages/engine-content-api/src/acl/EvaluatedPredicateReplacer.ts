import { Input, Model, Writable } from '@contember/schema'
import { replaceWhere } from '../mapper/select/optimizer/WhereReplacer.js'

export class EvaluatedPredicateReplacer {
	constructor(
		private readonly evaluatedPredicate: Input.OptionalWhere,
		private readonly sourceEntity: Model.Entity,
		private readonly relation: Model.AnyRelation,
		private readonly replacement: Input.OptionalWhere,
	) {
	}

	public replace(where: Input.OptionalWhere): Input.OptionalWhere {
		const result: Writable<Input.OptionalWhere> = {}
		for (const [key, value] of Object.entries(where)) {
			if (key === 'not') {
				result['not'] = this.replace(value as Input.OptionalWhere)
			} else if (key === 'and' || key === 'or') {
				result[key] = (value as Input.Where[]).map(it => this.replace(it))
			} else if (key === this.relation.name && this.isOptionalWhere(value)) {
				result[key] = replaceWhere(value, this.evaluatedPredicate, this.replacement)
			} else {
				result[key] = value
			}
		}
		return result
	}

	private isOptionalWhere(value: unknown): value is Input.OptionalWhere {
		return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)
	}
}
