import { Input, Model } from '@contember/schema'
import { ConditionOptimizer } from './ConditionOptimizer'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { optimizeAnd, optimizeNot, optimizeOr } from './helpers'
import { replaceWhere } from './WhereReplacer'

type ExtendedRelationContext =
	& Model.AnyRelationContext
	& {
		parentExists: boolean
		isLast: boolean
	}

export class WhereOptimizer {
	constructor(
		private readonly model: Model.Schema,
		private readonly conditionOptimizer: ConditionOptimizer,
	) {
	}

	public optimize(where: Input.OptionalWhere, entity: Model.Entity, relationPath: Model.AnyRelationContext[] = []): Input.Where {
		const result = this.optimizeWhere(where, entity, relationPath.map((it, index, arr) => ({ ...it, parentExists: true, isLast: index === arr.length - 1 })))

		if (typeof result === 'boolean') {
			return { [entity.primary]: { [result ? 'always' : 'never']: true } }
		}

		return result
	}

	private optimizeWhere(where: Input.OptionalWhere, entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.Where | boolean {
		return this.optimizeAnd(
			Object.entries(where).map(([key, value]) => {
				if (value === undefined || value === null) {
					return undefined

				} else if (key === 'and') {
					return this.optimizeAnd((value as readonly Input.Where[]).map(it => this.optimizeWhere(it, entity, relationPath)), entity, relationPath)

				} else if (key === 'or') {
					return this.optimizeOr((value as readonly Input.Where[]).map(it => this.optimizeWhere(it, entity, relationPath)), entity, relationPath)

				} else if (key === 'not') {
					return optimizeNot(this.optimizeWhere(value as Input.Where, entity, relationPath))

				} else {
					return this.resolveFieldValue(entity, key, value, relationPath)
				}
			}),
			entity,
			relationPath,
		)
	}

	private optimizeOr(operands: readonly (Input.Where | undefined | boolean)[], entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.Where | boolean {
		const optimized = optimizeOr(operands)
		if (typeof optimized === 'boolean' || !Array.isArray(optimized.or)) {
			return optimized
		}
		const result = this.crossOptimize(optimized.or, entity, { never: true }, relationPath)
		return optimizeOr(result)
	}

	private optimizeAnd(operands: readonly (Input.Where | undefined | boolean)[], entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.Where | boolean {
		const optimized = optimizeAnd(operands)
		if (typeof optimized === 'boolean' || !Array.isArray(optimized.and)) {
			return optimized
		}
		const result = this.crossOptimize(optimized.and, entity, { always: true }, relationPath)
		return optimizeAnd(result)
	}

	private crossOptimize(operands: Input.Where[], entity: Model.Entity, replacement: Input.Condition, relationPath: ExtendedRelationContext[]): (Input.Where | boolean)[] {
		const result: (Input.Where | boolean)[] = [...operands]
		const count = result.length
		for (let i = 0; i < count; i++) {
			for (let j = 0; j < count; j++) {
				const a = result[j]
				const b = result[i]
				if (i !== j && typeof a !== 'boolean' && typeof b !== 'boolean') {
					const tracker = { count: 0 }
					const elResult = replaceWhere(a, b, { [entity.primary]: replacement }, tracker)
					result[j] = tracker.count > 0 ? this.optimizeWhere(elResult, entity, relationPath) : elResult
				}
			}
		}
		return result
	}

	private resolveFieldValue(entity: Model.Entity, key: string, value: Input.OptionalWhere[string], relationPath: ExtendedRelationContext[]) {
		return acceptFieldVisitor<Input.Where | boolean>(this.model, entity, key, {
			visitColumn: () => {
				const optimizedCondition = this.conditionOptimizer.optimize(value as Input.Condition)

				if (typeof optimizedCondition === 'boolean') {
					return optimizedCondition
				}

				return { [key]: optimizedCondition }
			},
			visitRelation: context => {
				const { targetEntity, relation } = context
				let where = value as Input.Where
				const newRelationPath: ExtendedRelationContext[] = [...relationPath]
				if (relationPath.length && relationPath[relationPath.length - 1].targetRelation?.name === relation.name) {
					const item = newRelationPath.pop()
					if (item?.parentExists && (item.type === 'oneHasMany' || item.type === 'oneHasOneOwning' || item.type === 'oneHasOneInverse')) {
						where = replaceWhere(where, { [targetEntity.primary]: { isNull: true } }, { [targetEntity.primary]: { never: true } })
						where = replaceWhere(where, { [targetEntity.primary]: { isNull: false } }, { [targetEntity.primary]: { always: true } })
					}
				} else {
					// first level relation - we are sure root exists
					const parentExists = relationPath.length === 0 || relationPath[relationPath.length - 1].isLast
					newRelationPath.push({ ...context, isLast: false, parentExists })
				}
				const optimizedWhere = this.optimizeWhere(where, targetEntity, newRelationPath)

				if (typeof optimizedWhere === 'boolean') {
					return optimizedWhere
				}

				return { [key]: optimizedWhere }
			},
		})
	}
}
