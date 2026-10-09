import { Input, Model, Writable } from '@contember/schema'
import { ConditionOptimizer } from './ConditionOptimizer.js'
import { acceptFieldVisitor, getEntity, isRelation } from '@contember/schema-utils'
import deepEqual from 'fast-deep-equal'
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
	 * predicates and the guard-free operands of the top-level AND. Deeper, a sibling can be NULL under a `not`, and
	 * assuming it TRUE inside a guard would unmask a cell. A guarded operand can never equal a part of a guard, so
	 * only guard-free operands serve as facts, capped like the cross optimization so that a long AND stays linear.
	 */
	private simplifyGuardsWithFacts(
		where: Input.OptionalWhere,
		evaluatedFacts: readonly Input.OptionalWhere[],
		entity: Model.Entity,
		relationPath: ExtendedRelationContext[],
	): Input.OptionalWhere {
		const facts = evaluatedFacts.filter(isUsableFact)
		const simplified = facts.length > 0 ? this.simplifyGuards(where, facts, entity, relationPath) : where
		const operands = simplified.and
		if (!Array.isArray(operands)) {
			return simplified
		}
		const topLevel: readonly Input.OptionalWhere[] = operands
		const operandFacts = topLevel.filter(isUsableFact).slice(0, this.options?.maxCrossOptimizationInput ?? 50)
		if (operandFacts.length === 0) {
			return simplified
		}
		const simplifiedOperands = topLevel.map(operand => hasGuards(operand) ? this.simplifyGuards(operand, operandFacts, entity, relationPath) : operand)
		return simplifiedOperands.some((it, index) => it !== topLevel[index]) ? { ...simplified, and: simplifiedOperands } : simplified
	}

	/**
	 * Whether `facts`, wheres TRUE on the row, imply `guard`. A guard they imply holds on every row the query
	 * can select, so the hop it protects may join the plain table instead of a guarded source.
	 */
	public isImpliedByFacts(guard: Input.OptionalWhere, entity: Model.Entity, facts: readonly Input.OptionalWhere[]): boolean {
		const usableFacts = facts.filter(isUsableFact).map(it => this.optimize(it, entity))
		return usableFacts.length > 0 && this.isImpliedByOptimizedFacts(guard, entity, usableFacts)
	}

	private isImpliedByOptimizedFacts(guard: Input.OptionalWhere, entity: Model.Entity, facts: readonly Input.OptionalWhere[]): boolean {
		const optimizedGuard = this.optimizeWhere(guard, entity, [])
		if (typeof optimizedGuard === 'boolean') {
			return optimizedGuard
		}
		return this.optimizeWhere(this.replaceFacts(optimizedGuard, facts, entity), entity, []) === true
	}

	/**
	 * Facts about the row a to-one relation joins. A fact TRUE on a row holds on the (possibly null-extended) row its
	 * to-one relation joins, so each operand of its top-level AND over that relation is a fact there. A to-many
	 * relation joins many rows, which share no fact.
	 */
	public factsThroughRelation(facts: readonly Input.OptionalWhere[], entity: Model.Entity, relationName: string): Input.OptionalWhere[] {
		if (this.getToOneTarget(entity, relationName) === undefined) {
			return []
		}
		const relationOperands = (fact: Input.OptionalWhere): Input.OptionalWhere[] => {
			const value = fact[relationName]
			const operands = Array.isArray(fact.and) ? fact.and.filter(isWhere).flatMap(relationOperands) : []
			return isWhere(value) ? [value, ...operands] : operands
		}
		return facts.flatMap(relationOperands)
	}

	private getToOneTarget(entity: Model.Entity, fieldName: string): Model.Entity | undefined {
		const field = entity.fields[fieldName]
		if (field === undefined || !isRelation(field)) {
			return undefined
		}
		const isToOne = field.type === Model.RelationType.ManyHasOne || field.type === Model.RelationType.OneHasOne
		return isToOne ? getEntity(this.model, field.target) : undefined
	}

	/** Replaces every part of `where` equal to a fact with TRUE, following the facts into to-one relations. */
	private replaceFacts(where: Input.OptionalWhere, facts: readonly Input.OptionalWhere[], entity: Model.Entity): Input.OptionalWhere {
		if (facts.some(fact => deepEqual(where, fact))) {
			return { [entity.primary]: { always: true } }
		}
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
				const replaced = operands.map(it => this.replaceFacts(it, facts, entity))
				if (replaced.some((it, index) => it !== operands[index])) {
					write(key, replaced)
				}
			} else if (key === 'not' && isWhere(value)) {
				const replaced = this.replaceFacts(value, facts, entity)
				if (replaced !== value) {
					write(key, replaced)
				}
			} else if (isWhere(value)) {
				const target = this.getToOneTarget(entity, key)
				const targetFacts = target === undefined ? [] : this.factsThroughRelation(facts, entity, key)
				const replaced = target === undefined || targetFacts.length === 0 ? value : this.replaceFacts(value, targetFacts, target)
				if (replaced !== value) {
					write(key, replaced)
				}
			}
		}
		return result
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
	 * Replaces `facts`, known to hold on the row, inside the read guards of `where` (field guards of its relations
	 * and masked-cell guards; a guard reads the same row), and follows them into its to-one relation hops. Only the
	 * guards are re-optimized, so the user's condition keeps the shape it was optimized into.
	 */
	private simplifyGuards(
		where: Input.OptionalWhere,
		facts: readonly Input.OptionalWhere[],
		entity: Model.Entity,
		relationPath: ExtendedRelationContext[],
	): Input.OptionalWhere {
		const simplifyGuard = (guard: Input.OptionalWhere): Input.OptionalWhere | boolean | undefined => {
			const replaced = this.replaceFacts(guard, facts, entity)
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
		const readableCells: Input.OptionalWhere[] = []
		for (const key in where) {
			const value = where[key]
			if ((key === 'and' || key === 'or') && Array.isArray(value)) {
				const operands: readonly Input.OptionalWhere[] = value
				const simplified = operands.map(it => this.simplifyGuards(it, facts, entity, relationPath))
				if (simplified.some((it, index) => it !== operands[index])) {
					write(key, simplified)
				}
			} else if (key === 'not' && isWhere(value)) {
				const simplified = this.simplifyGuards(value, facts, entity, relationPath)
				if (simplified !== value) {
					write(key, simplified)
				}
			} else if (key === MASKED_CELL_KEY) {
				const cells = parseMaskedCells(value).map(cell => ({ cell, guard: simplifyGuard(cell.guard) }))
				if (cells.every(it => it.guard === undefined)) {
					continue
				}
				// A cell whose guard always holds reads its plain value.
				readableCells.push(...cells.filter(it => it.guard === true).map(it => it.cell.where))
				write(
					key,
					cells
						.filter(it => it.guard !== true)
						.map(({ cell, guard }) => guard === undefined ? cell : { guard: asWhere(guard), where: cell.where }),
				)
			} else if (isWhere(value)) {
				const { fieldGuard, where: relationWhere } = splitFieldGuard(value)
				const guard = fieldGuard === undefined ? undefined : simplifyGuard(fieldGuard)
				const hopWhere = this.simplifyHopGuards(relationWhere, facts, entity, key)
				if (guard === true) {
					write(key, hopWhere)
				} else if (guard !== undefined) {
					write(key, { ...hopWhere, [FIELD_GUARD_KEY]: asWhere(guard) })
				} else if (hopWhere !== relationWhere) {
					write(key, fieldGuard === undefined ? hopWhere : { ...hopWhere, [FIELD_GUARD_KEY]: fieldGuard })
				}
			}
		}
		if (readableCells.length === 0) {
			return result
		}
		const { [MASKED_CELL_KEY]: maskedCells, and, ...rest } = result
		const operands = [...(Array.isArray(and) ? and : []), ...readableCells]
		const masked = Array.isArray(maskedCells) && maskedCells.length > 0 ? { [MASKED_CELL_KEY]: maskedCells } : {}
		if (operands.length === 1 && Object.keys(rest).length === 0 && Object.keys(masked).length === 0) {
			return operands[0]
		}
		return { ...rest, and: operands, ...masked }
	}

	/**
	 * Follows the facts into a to-one relation hop. Its read guard is dropped when the facts imply it, so the hop
	 * shares the plain join of an ACL predicate through the same relation instead of joining a guarded source.
	 */
	private simplifyHopGuards(
		where: Input.OptionalWhere,
		facts: readonly Input.OptionalWhere[],
		entity: Model.Entity,
		relationName: string,
	): Input.OptionalWhere {
		const target = this.getToOneTarget(entity, relationName)
		const targetFacts = target === undefined ? [] : this.factsThroughRelation(facts, entity, relationName)
		if (target === undefined || targetFacts.length === 0) {
			return where
		}
		const { [READ_GUARD_KEY]: readGuard, ...rest } = where
		const simplified = this.simplifyGuards(rest, targetFacts, target, [])
		const keepsGuard = isWhere(readGuard) && !this.isImpliedByOptimizedFacts(readGuard, target, targetFacts)
		if (keepsGuard) {
			return simplified === rest ? where : { ...simplified, [READ_GUARD_KEY]: readGuard }
		}
		return readGuard === undefined && simplified === rest ? where : simplified
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

const guardKeys = new Set<string>([READ_GUARD_KEY, FIELD_GUARD_KEY, MASKED_CELL_KEY])

const hasGuards = (value: unknown): boolean => {
	if (Array.isArray(value)) {
		return value.some(hasGuards)
	}
	if (value === null || typeof value !== 'object') {
		return false
	}
	return Object.entries(value).some(([key, item]) => guardKeys.has(key) || hasGuards(item))
}

/** A guarded where tells nothing about the plain rows a guard reads (an unreadable row reads as absent there). */
const isUsableFact = (fact: Input.OptionalWhere): boolean => Object.keys(fact).length > 0 && !hasGuards(fact)
