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

type OptimizedOperand = Input.OptionalWhere | undefined | boolean

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
		let changed = false
		for (const evaluated of evaluatedPredicates) {
			const evaluatedPredicate = this.optimize(evaluated, entity)
			const newResult = replaceWhere(result, evaluatedPredicate, { [entity.primary]: { always: true } })
			if (newResult !== result) {
				result = newResult
				changed = true
			}
		}
		if (changed) {
			return this.optimize(result, entity)
		}

		return result
	}

	private optimizeWhere(where: Input.OptionalWhere, entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.OptionalWhere | boolean {
		const operands: OptimizedOperand[] = []

		for (const key in where) {
			const value = where[key]
			let operand: OptimizedOperand = undefined
			if (value === undefined || value === null) {
				continue
			} else if (key === 'and') {
				const elements: (Input.OptionalWhere | boolean)[] = []
				for (const el of value as readonly Input.OptionalWhere[]) {
					const elOptimized = this.optimizeWhere(el, entity, relationPath)
					if (elOptimized === false) {
						return false
					}
					elements.push(elOptimized)
				}
				operand = this.optimizeAnd(elements, entity, relationPath)
			} else if (key === 'or') {
				const innerOperands: (Input.OptionalWhere | boolean)[] = []
				for (const innerValue of value as readonly Input.OptionalWhere[]) {
					const innerOperand = this.optimizeWhere(innerValue, entity, relationPath)
					if (innerOperand === true) {
						operand = true
						break
					}
					innerOperands.push(innerOperand)
				}
				if (operand !== true) {
					operand = this.optimizeOr(innerOperands, entity, relationPath)
				}

			} else if (key === 'not') {
				operand = optimizeNot(this.optimizeWhere(value as Input.OptionalWhere, entity, relationPath))

			} else {
				operand = this.resolveFieldValue(entity, key, value, relationPath)
			}

			if (operand === false) {
				return false

			} else if (operand !== undefined) {
				operands.push(operand)
			}
		}
		return this.optimizeAnd(operands, entity, relationPath)
	}

	private optimizeOr(operands: readonly OptimizedOperand[], entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.OptionalWhere | boolean {
		const optimized = optimizeOr(operands)
		if (typeof optimized === 'boolean' || !Array.isArray(optimized.or)) {
			return optimized
		}
		const result = this.crossOptimize(optimized.or, entity, { never: true }, relationPath)
		if (result === optimized.or) {
			return optimized
		}
		return optimizeOr(result)
	}

	private optimizeAnd(operands: readonly OptimizedOperand[], entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.OptionalWhere | boolean {
		const optimized = optimizeAnd(operands)
		if (typeof optimized === 'boolean' || !Array.isArray(optimized.and)) {
			return optimized
		}
		const result = this.crossOptimize(optimized.and, entity, { always: true }, relationPath)
		if (result === optimized.and) {
			return optimized
		}
		return optimizeAnd(result)
	}

	private crossOptimize(operands: Input.OptionalWhere[], entity: Model.Entity, replacement: Input.Condition, relationPath: ExtendedRelationContext[]): (Input.OptionalWhere | boolean)[] {
		let result: (Input.OptionalWhere | boolean)[] = operands
		let copied = false
		const count = result.length
		for (let i = 0; i < count; i++) {
			for (let j = 0; j < count; j++) {
				const a = result[j]
				const b = result[i]
				if (i !== j && typeof a !== 'boolean' && typeof b !== 'boolean') {
					const elResult = replaceWhere(a, b, { [entity.primary]: replacement })
					if (elResult !== a) {
						if (!copied) {
							result = [...result]
							copied = true
						}
						result[j] = this.optimizeWhere(elResult, entity, relationPath)
					}
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
