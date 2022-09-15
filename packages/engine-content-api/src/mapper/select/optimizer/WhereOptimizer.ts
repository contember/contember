import { Input, Model } from '@contember/schema'
import { ConditionOptimizer } from './ConditionOptimizer'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { optimizeAnd, optimizeNot, optimizeOr } from './helpers'
import { replaceWhere } from './WhereReplacer'

type ExtendedRelationContext =
	& {
		context: Model.AnyRelationContext
		canEliminate: boolean
		isLast: boolean
	}

export interface WhereOptimizationHints {
	relationPath?: Model.AnyRelationContext[]
	evaluatedPredicates?: Input.OptionalWhere[]
}

export class WhereOptimizer {
	private static eliminableRelations = new Set<Model.AnyRelationContext['type']>(['oneHasMany', 'oneHasOneInverse', 'oneHasOneOwning'])

	constructor(
		private readonly model: Model.Schema,
		private readonly conditionOptimizer: ConditionOptimizer,
	) {
	}

	public optimize(where: Input.OptionalWhere, entity: Model.Entity, { relationPath = [], evaluatedPredicates = [] }: WhereOptimizationHints = {}): Input.OptionalWhere {
		let processedRelationPath: ExtendedRelationContext[] = []
		for (const i in relationPath) {
			const el = relationPath[i]
			if (!WhereOptimizer.eliminableRelations.has(el.type)) {
				processedRelationPath = []
			} else {
				processedRelationPath.push({ context: el, canEliminate: true, isLast: Number(i) === relationPath.length })
			}
		}
		let result = this.optimizeWhere(where, entity, processedRelationPath)

		if (typeof result === 'boolean') {
			return { [entity.primary]: { [result ? 'always' : 'never']: true } }
		}
		const resultTracker = { count: 0 }
		for (const evaluated of evaluatedPredicates) {
			const evaluatedPredicate = this.optimize(evaluated, entity)
			result = replaceWhere(result, evaluatedPredicate, { [entity.primary]: { always: true } }, resultTracker)
		}
		if (resultTracker.count > 0) {
			return this.optimize(result, entity)
		}

		return result
	}

	private optimizeWhere(where: Input.OptionalWhere, entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.OptionalWhere | boolean {
		return this.optimizeAnd(
			Object.entries(where).map(([key, value]) => {
				if (value === undefined || value === null) {
					return undefined

				} else if (key === 'and') {
					return this.optimizeAnd((value as readonly Input.OptionalWhere[]).map(it => this.optimizeWhere(it, entity, relationPath)), entity, relationPath)

				} else if (key === 'or') {
					return this.optimizeOr((value as readonly Input.OptionalWhere[]).map(it => this.optimizeWhere(it, entity, relationPath)), entity, relationPath)

				} else if (key === 'not') {
					return optimizeNot(this.optimizeWhere(value as Input.OptionalWhere, entity, relationPath))

				} else {
					return this.resolveFieldValue(entity, key, value, relationPath)
				}
			}),
			entity,
			relationPath,
		)
	}

	private optimizeOr(operands: readonly (Input.OptionalWhere | undefined | boolean)[], entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.OptionalWhere | boolean {
		const optimized = optimizeOr(operands)
		if (typeof optimized === 'boolean' || !Array.isArray(optimized.or)) {
			return optimized
		}
		const result = this.crossOptimize(optimized.or, entity, { never: true }, relationPath)
		return optimizeOr(result)
	}

	private optimizeAnd(operands: readonly (Input.OptionalWhere | undefined | boolean)[], entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.OptionalWhere | boolean {
		const optimized = optimizeAnd(operands)
		if (typeof optimized === 'boolean' || !Array.isArray(optimized.and)) {
			return optimized
		}
		const result = this.crossOptimize(optimized.and, entity, { always: true }, relationPath)
		return optimizeAnd(result)
	}

	private crossOptimize(operands: Input.OptionalWhere[], entity: Model.Entity, replacement: Input.Condition, relationPath: ExtendedRelationContext[]): (Input.OptionalWhere | boolean)[] {
		const result: (Input.OptionalWhere | boolean)[] = [...operands]
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
		return acceptFieldVisitor<Input.OptionalWhere | boolean>(this.model, entity, key, {
			visitColumn: () => {
				const optimizedCondition = this.conditionOptimizer.optimize(value as Input.Condition)

				if (typeof optimizedCondition === 'boolean') {
					return optimizedCondition
				}

				return { [key]: optimizedCondition }
			},
			visitRelation: context => {
				let where = value as Input.OptionalWhere
				const newRelationPath: ExtendedRelationContext[] = [...relationPath]
				const length = relationPath.length
				if (length > 0 && relationPath[length - 1].context.targetRelation?.name === context.relation.name) {
					const item = newRelationPath.pop()
					const type = item!.context.type
					if (item?.canEliminate && (type === 'oneHasMany' || type === 'oneHasOneOwning' || type === 'oneHasOneInverse')) {
						where = replaceWhere(where, { [context.targetEntity.primary]: { isNull: true } }, { [context.targetEntity.primary]: { never: true } })
						where = replaceWhere(where, { [context.targetEntity.primary]: { isNull: false } }, { [context.targetEntity.primary]: { always: true } })
					}
				} else {
					// first level relation - we are sure root exists
					const canEliminate = length === 0 || relationPath[length - 1].isLast
					newRelationPath.push({ context, isLast: false, canEliminate })
				}
				const optimizedWhere = this.optimizeWhere(where, context.targetEntity, newRelationPath)

				if (typeof optimizedWhere === 'boolean') {
					return optimizedWhere
				}

				return { [key]: optimizedWhere }
			},
		})
	}
}
