import { Input, Model } from '@contember/schema'
import { ConditionOptimizer } from './ConditionOptimizer'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { optimizeJunction, ResultCollector } from './helpers'

export class WhereOptimizer {
	constructor(
		private readonly model: Model.Schema,
		private readonly conditionOptimizer: ConditionOptimizer,
	) {
	}

	public optimize(where: Input.OptionalWhere, entity: Model.Entity): Input.Where {
		const result = this.optimizeWhere(where, entity)

		if (result === false) {
			return { [entity.primary]: { never: true } }
		} else if (result === true) {
			return { [entity.primary]: { always: true } }
		}

		if (result.length === 0) {
			return {}
		}

		return result.length === 1 ? result[0] : { and: result }
	}

	private optimizeWhere(where: Input.OptionalWhere, entity: Model.Entity): Input.Where[] | boolean {
		const resultCollector = new ResultCollector<Input.Where>()

		for (const [key, value] of Object.entries(where)) {
			if (value === undefined || value === null) {
				// do nothing
			} else if (key === 'or' || key === 'and') {
				const parts = (value as readonly Input.Where[]).map(it => this.optimizeWhere(it, entity))
				resultCollector.add(optimizeJunction(key, parts), key)
			} else if (key === 'not') {
				resultCollector.add(this.optimizeWhere(value as Input.Where, entity), 'not')
			} else {
				const resolved = this.resolveFieldValue(entity, key, value)
				resultCollector.add(resolved, 'and')
			}
		}

		return resultCollector.getResult()
	}

	private resolveFieldValue(entity: Model.Entity, key: string, value: Input.OptionalWhere[string]) {
		return acceptFieldVisitor<Input.Where[] | boolean>(this.model, entity, key, {
			visitColumn: () => {
				const optimizedCondition = this.conditionOptimizer.optimize(value as Input.Condition)

				if (typeof optimizedCondition === 'boolean') {
					return optimizedCondition
				}

				return [{ [key]: optimizedCondition }]
			},
			visitRelation: (entity, relation, targetEntity) => {
				const optimizedWhere = this.optimizeWhere(value as Input.Where, targetEntity)

				if (typeof optimizedWhere === 'boolean') {
					return optimizedWhere
				}

				return optimizedWhere.map(it => ({ [key]: it }))
			},
		})
	}
}
