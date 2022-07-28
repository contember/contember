import { Input, Model } from '@contember/schema'
import { ConditionOptimizationHelper } from './ConditionOptimizationHelper'
import { ConditionOptimizer } from './ConditionOptimizer'
import { acceptFieldVisitor } from '@contember/schema-utils'

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

		return result.length === 1 ? result[0] : { and: result }
	}

	private optimizeWhere(where: Input.OptionalWhere, entity: Model.Entity): Input.Where[] | boolean {
		const resultWhere: Input.Where[] = []
		let hasAlways = false
		for (const [key, value] of Object.entries(where)) {
			if (value === undefined || value === null) {
				continue
			}
			if (key === 'or' || key === 'and') {
				const resolved = this[key === 'or' ? 'optimizeWhereOr' : 'optimizeWhereAnd'](value as readonly Input.Where[], entity)
				if (resolved === false) {
					return false
				}
				if (resolved === true) {
					hasAlways = true
					continue
				}
				if (key === 'and') {
					resultWhere.push(...resolved)
				} else {
					if (resolved.length === 1) {
						resultWhere.push(resolved[0])
					} else if (resolved.length > 1) {
						resultWhere.push({ or: resolved })
					}
				}
			} else if (key === 'not') {
				const resolved = this.optimizeWhere(value as Input.Where, entity)
				if (resolved === true) {
					return false
				}
				if (resolved === false) {
					hasAlways = true
					continue
				}
				resultWhere.push({ not: resolved.length === 1 ? resolved[0] : { and: resolved } })
			} else {
				const resolved = acceptFieldVisitor<Input.Where[] | boolean>(this.model, entity, key, {
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
				if (resolved === false) {
					return false
				}
				if (resolved === true) {
					hasAlways = true
					continue
				}
				resultWhere.push(...resolved)
			}
		}
		if (resultWhere.length === 0 && hasAlways) {
			return true
		}
		return resultWhere
	}

	private optimizeWhereOr(parts: readonly Input.Where[], entity: Model.Entity): Input.Where[] | boolean {
		return ConditionOptimizationHelper.optimizeOr(parts.map(it => this.optimizeWhere(it, entity)))
	}

	private optimizeWhereAnd(parts: readonly Input.Where[], entity: Model.Entity): Input.Where[] | boolean {
		return ConditionOptimizationHelper.optimizeAnd(parts.map(it => this.optimizeWhere(it, entity)))
	}
}
