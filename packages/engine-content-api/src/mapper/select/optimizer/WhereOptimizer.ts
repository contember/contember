import { Input, Model, Writable } from '@contember/schema'
import { ConditionOptimizer } from './ConditionOptimizer.js'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { optimizeAnd, optimizeNot, optimizeOr } from './helpers.js'
import { replaceWhere } from './WhereReplacer.js'
import {
	FIELD_GUARD_KEY,
	isWhere,
	MASKED_CELL_KEY,
	MaskedCell,
	parseMaskedCells,
	READ_GUARD_KEY,
	splitFieldGuard,
	splitReadGuard,
} from '../../../acl/PredicatesInjector.js'

type ExtendedRelationContext = {
	context: Model.AnyRelationContext
	canEliminate: boolean
	isLast: boolean
}

export interface WhereOptimizationHints {
	relationPath?: Model.AnyRelationContext[]
	evaluatedPredicates?: Input.OptionalWhere[]
}

type OptimizedOperand = Input.OptionalWhere | undefined | boolean

export type WhereOptimizerOptions = {
	disable?: boolean
	maxCrossOptimizationInput?: number
}

export class WhereOptimizer {
	private static eliminableRelations = new Set<Model.AnyRelationContext['type']>(['oneHasMany', 'oneHasOneInverse', 'oneHasOneOwning'])

	constructor(
		private readonly model: Model.Schema,
		private readonly conditionOptimizer: ConditionOptimizer,
		private readonly options?: WhereOptimizerOptions,
	) {
	}

	public optimize(
		where: Input.OptionalWhere,
		entity: Model.Entity,
		{ relationPath = [], evaluatedPredicates = [] }: WhereOptimizationHints = {},
	): Input.OptionalWhere {
		if (this.options?.disable) {
			return where
		}
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
		const facts: Input.OptionalWhere[] = []
		for (const evaluated of evaluatedPredicates) {
			const evaluatedPredicate = this.optimize(evaluated, entity)
			facts.push(evaluatedPredicate)
			const newResult = replaceWhere(result, evaluatedPredicate, { [entity.primary]: { always: true } })
			if (newResult !== result) {
				result = newResult
				changed = true
			}
		}
		if (changed) {
			result = this.optimize(result, entity)
		}
		return this.simplifyGuardsWithFacts(result, facts, entity, processedRelationPath)
	}

	/**
	 * Guards may only be simplified with facts that hold on every row the query can select: the evaluated
	 * predicates and the operands of the top-level AND. Deeper, a sibling can be NULL under a `not`, and assuming
	 * it TRUE inside a guard would unmask a cell.
	 */
	private simplifyGuardsWithFacts(
		where: Input.OptionalWhere,
		facts: readonly Input.OptionalWhere[],
		entity: Model.Entity,
		relationPath: ExtendedRelationContext[],
	): Input.OptionalWhere {
		const simplified = facts.reduce((it, fact) => this.simplifyGuards(it, fact, entity, relationPath), where)
		const operands = simplified.and
		if (!Array.isArray(operands)) {
			return simplified
		}
		const topLevel: readonly Input.OptionalWhere[] = operands
		const simplifiedOperands = topLevel.map((operand, index) =>
			topLevel.reduce((it, fact, factIndex) => factIndex === index ? it : this.simplifyGuards(it, fact, entity, relationPath), operand)
		)
		return simplifiedOperands.some((it, index) => it !== topLevel[index]) ? { ...simplified, and: simplifiedOperands } : simplified
	}

	private optimizeWhere(where: Input.OptionalWhere, entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.OptionalWhere | boolean {
		const { guard, where: rest } = splitReadGuard(where ?? {})
		const optimizedRest = this.optimizeWhereOperands(rest, entity, relationPath)
		if (Object.keys(guard).length === 0 || typeof optimizedRest === 'boolean') {
			// A hop without any remaining condition is a no-op whatever its guard (an empty relation filter).
			return optimizedRest
		}
		// The guard is a where over the same target rows, but it is compiled into the hop's table source
		// rather than its condition, so it is optimized on its own and kept out of the AND above.
		const optimizedGuard = this.optimizeWhereOperands(guard, entity, relationPath)
		if (optimizedGuard === true) {
			return optimizedRest
		}
		const guardWhere = optimizedGuard === false ? { [entity.primary]: { never: true } } : optimizedGuard
		return { ...optimizedRest, [READ_GUARD_KEY]: guardWhere }
	}

	private optimizeWhereOperands(
		where: Input.OptionalWhere,
		entity: Model.Entity,
		relationPath: ExtendedRelationContext[],
	): Input.OptionalWhere | boolean {
		const operands: OptimizedOperand[] = []

		for (const key in where) {
			const value = where[key]
			let operand: OptimizedOperand
			if (value === undefined || value === null) {
				continue
			} else if (key === 'and') {
				const innerOperands: (Input.OptionalWhere | boolean)[] = []
				for (const innerValue of value as readonly Input.OptionalWhere[]) {
					const innerOperand = this.optimizeWhere(innerValue, entity, relationPath)
					if (innerOperand === false) {
						return false
					}
					innerOperands.push(innerOperand)
				}
				operand = this.optimizeAnd(innerOperands, entity, relationPath)
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
			} else if (key === MASKED_CELL_KEY) {
				operand = this.optimizeAnd(parseMaskedCells(value).map(cell => this.optimizeMaskedCell(cell, entity, relationPath)), entity, relationPath)
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

	/**
	 * Replaces `fact`, known to hold on the row, inside the read guards of `where` (field guards of its relations
	 * and masked-cell guards; a guard reads the same row). Only the guards are re-optimized, so the user's
	 * condition keeps the shape it was optimized into.
	 */
	private simplifyGuards(
		where: Input.OptionalWhere,
		fact: Input.OptionalWhere,
		entity: Model.Entity,
		relationPath: ExtendedRelationContext[],
	): Input.OptionalWhere {
		const simplifyGuard = (guard: Input.OptionalWhere): Input.OptionalWhere | boolean | undefined => {
			const replaced = replaceWhere(guard, fact, { [entity.primary]: { always: true } })
			return replaced === guard ? undefined : this.optimizeWhere(replaced, entity, relationPath)
		}
		const asWhere = (guard: Input.OptionalWhere | boolean): Input.OptionalWhere =>
			typeof guard === 'boolean' ? { [entity.primary]: { [guard ? 'always' : 'never']: true } } : guard
		let result: Writable<Input.OptionalWhere> = where
		const write = (key: string, value: Input.OptionalWhere[string]) => {
			if (result === where) {
				result = { ...where }
			}
			result[key] = value
		}
		for (const key in where) {
			const value = where[key]
			if ((key === 'and' || key === 'or') && Array.isArray(value)) {
				const operands: readonly Input.OptionalWhere[] = value
				const simplified = operands.map(it => this.simplifyGuards(it, fact, entity, relationPath))
				if (simplified.some((it, index) => it !== operands[index])) {
					write(key, simplified)
				}
			} else if (key === 'not' && isWhere(value)) {
				const simplified = this.simplifyGuards(value, fact, entity, relationPath)
				if (simplified !== value) {
					write(key, simplified)
				}
			} else if (key === MASKED_CELL_KEY) {
				const cells = parseMaskedCells(value)
				const simplified = cells.map(cell => {
					const guard = simplifyGuard(cell.guard)
					return guard === undefined ? cell : { guard: asWhere(guard), where: cell.where }
				})
				if (simplified.some((it, index) => it !== cells[index])) {
					write(key, simplified)
				}
			} else if (isWhere(value)) {
				const { fieldGuard, where: relationWhere } = splitFieldGuard(value)
				const guard = fieldGuard === undefined ? undefined : simplifyGuard(fieldGuard)
				if (guard === true) {
					write(key, relationWhere)
				} else if (guard !== undefined) {
					write(key, { ...relationWhere, [FIELD_GUARD_KEY]: asWhere(guard) })
				}
			}
		}
		return result
	}

	/** Guard and condition are optimized apart: the masked form depends on the condition alone. */
	private optimizeMaskedCell(masked: MaskedCell, entity: Model.Entity, relationPath: ExtendedRelationContext[]): Input.OptionalWhere | boolean {
		const where = this.optimizeWhere(masked.where, entity, relationPath)
		const guard = this.optimizeWhere(masked.guard, entity, relationPath)
		if (typeof where === 'boolean' || guard === true || (typeof guard !== 'boolean' && Object.keys(guard).length === 0)) {
			return where
		}
		return { [MASKED_CELL_KEY]: [{ guard: guard === false ? { [entity.primary]: { never: true } } : guard, where }] }
	}

	private optimizeOr(
		operands: readonly OptimizedOperand[],
		entity: Model.Entity,
		relationPath: ExtendedRelationContext[],
	): Input.OptionalWhere | boolean {
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

	private optimizeAnd(
		operands: readonly OptimizedOperand[],
		entity: Model.Entity,
		relationPath: ExtendedRelationContext[],
	): Input.OptionalWhere | boolean {
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

	private crossOptimize(
		operands: Input.OptionalWhere[],
		entity: Model.Entity,
		replacement: Input.Condition,
		relationPath: ExtendedRelationContext[],
	): (Input.OptionalWhere | boolean)[] {
		let result: (Input.OptionalWhere | boolean)[] = operands
		let copied = false
		const count = Math.min(result.length, this.options?.maxCrossOptimizationInput ?? 50)
		for (let i = 0; i < count; i++) {
			for (let j = 0; j < count; j++) {
				const a = result[j]
				const b = result[i]
				if (i !== j && typeof a !== 'boolean' && typeof b !== 'boolean') {
					const elResult = replaceWhere(a, b, { [entity.primary]: replacement }, {
						replaceSubOperands: true,
					})
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
				// The field guard is a where over this (source) entity, so it is optimized here, not with the target.
				const { fieldGuard: rawFieldGuard, where: relationWhere } = splitFieldGuard(value as Input.OptionalWhere)
				const fieldGuard = rawFieldGuard === undefined ? true : this.optimizeWhere(rawFieldGuard, entity, relationPath)
				let where: Input.OptionalWhere = relationWhere
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
				if (fieldGuard === true || (fieldGuard !== false && Object.keys(fieldGuard).length === 0)) {
					return { [key]: optimizedWhere }
				}
				const fieldGuardWhere = fieldGuard === false ? { [entity.primary]: { never: true } } : fieldGuard
				return { [key]: { ...optimizedWhere, [FIELD_GUARD_KEY]: fieldGuardWhere } }
			},
		})
	}
}
