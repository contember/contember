import { Input, Model } from '@contember/schema'
import { ConditionOptimizer } from './ConditionOptimizer'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { optimizeAnd, optimizeNot, optimizeOr } from './helpers'
import { replaceWhere } from './WhereReplacer'

export class WhereOptimizer {
	constructor(
		private readonly model: Model.Schema,
		private readonly conditionOptimizer: ConditionOptimizer,
	) {
	}

	public optimize(where: Input.OptionalWhere, entity: Model.Entity): Input.Where {
		const result = this.optimizeWhere(where, entity)

		if (typeof result === 'boolean') {
			return { [entity.primary]: { [result ? 'always' : 'never']: true } }
		}

		return result
	}

	private optimizeWhere(where: Input.OptionalWhere, entity: Model.Entity): Input.Where | boolean {
		return this.optimizeAnd(
			Object.entries(where).map(([key, value]) => {
				if (value === undefined || value === null) {
					return undefined

				} else if (key === 'and') {
					return this.optimizeAnd((value as readonly Input.Where[]).map(it => this.optimizeWhere(it, entity)), entity)

				} else if (key === 'or') {
					return this.optimizeOr((value as readonly Input.Where[]).map(it => this.optimizeWhere(it, entity)), entity)

				} else if (key === 'not') {
					return optimizeNot(this.optimizeWhere(value as Input.Where, entity))

				} else {
					return this.resolveFieldValue(entity, key, value)
				}
			}),
			entity,
		)
	}

	private optimizeOr(operands: (Input.Where | undefined | boolean)[], entity: Model.Entity): Input.Where | boolean {
		const optimized = optimizeOr(operands)
		if (typeof optimized === 'boolean' || !Array.isArray(optimized.or)) {
			return optimized
		}
		const result = this.minimize(optimized.or, entity, { never: true })
		return optimizeOr(result.map(it => this.optimizeWhere(it, entity)))
	}

	private optimizeAnd(operands: (Input.Where | undefined | boolean)[], entity: Model.Entity): Input.Where | boolean {
		const optimized = optimizeAnd(operands)
		if (typeof optimized === 'boolean' || !Array.isArray(optimized.and)) {
			return optimized
		}
		const result = this.minimize(optimized.and, entity, { always: true })
		return optimizeAnd(result.map(it => this.optimizeWhere(it, entity)))
	}

	private minimize(operands: Input.Where[], entity: Model.Entity, replacement: Input.Condition): Input.Where[] {
		let result = [...operands]
		const count = result.length
		for (let i = 0; i < count; i++) {
			for (let j = i + 1; j < count; j++) {
				const tracker = { count: 0 }
				result[j] = replaceWhere(result[j], result[i], { [entity.primary]: replacement }, tracker)
				if (tracker.count === 0) {
					result[i] = replaceWhere(result[i], result[j], { [entity.primary]: replacement })
				}
			}
		}
		return result
	}

	private resolveFieldValue(entity: Model.Entity, key: string, value: Input.OptionalWhere[string]) {
		return acceptFieldVisitor<Input.Where | boolean>(this.model, entity, key, {
			visitColumn: () => {
				const optimizedCondition = this.conditionOptimizer.optimize(value as Input.Condition)

				if (typeof optimizedCondition === 'boolean') {
					return optimizedCondition
				}

				return { [key]: optimizedCondition }
			},
			visitRelation: (entity, relation, targetEntity) => {
				const optimizedWhere = this.optimizeWhere(value as Input.Where, targetEntity)

				if (typeof optimizedWhere === 'boolean') {
					return optimizedWhere
				}

				return { [key]: optimizedWhere }
			},
		})
	}
}
