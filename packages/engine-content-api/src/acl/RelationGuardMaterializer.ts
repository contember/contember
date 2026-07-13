import { Input, Model } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import deepEqual from 'fast-deep-equal'
import type { RelationPredicateGuard } from './PredicateInjection.js'

export interface FieldPredicateGuard {
	create(
		entity: Model.Entity,
		fieldNames: readonly string[],
		traversedRelationPath: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere
}

const isOptionalWhere = (value: unknown): value is Input.OptionalWhere =>
	value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)

const combineWhereAnd = (wheres: readonly Input.OptionalWhere[]): Input.OptionalWhere => {
	const nonEmpty: Input.OptionalWhere[] = []
	for (const where of wheres) {
		if (Object.keys(where).length > 0 && !nonEmpty.some(existing => deepEqual(existing, where))) {
			nonEmpty.push(where)
		}
	}
	if (nonEmpty.length === 0) {
		return {}
	}
	return nonEmpty.length === 1 ? nonEmpty[0] : { and: nonEmpty }
}

export const createGuardObligationWhere = (
	schema: Model.Schema,
	entity: Model.Entity,
	where: Input.OptionalWhere,
	targetGuard: Input.OptionalWhere,
	relationGuard: RelationPredicateGuard,
	traversedRelationPath: readonly Model.AnyRelationContext[],
	fieldGuard?: FieldPredicateGuard,
): Input.OptionalWhere => {
	const collect = (currentWhere: Input.OptionalWhere): { where: Input.OptionalWhere; hasGuard: boolean } => {
		const conjuncts: Input.OptionalWhere[] = []
		const directFieldNames: string[] = []
		let hasGuard = false

		if (currentWhere.and) {
			const andObligations: Input.OptionalWhere[] = []
			for (const item of currentWhere.and) {
				if (item) {
					const obligation = collect(item)
					if (obligation.hasGuard) {
						hasGuard = true
						andObligations.push(obligation.where)
					}
				}
			}
			if (andObligations.length > 0) {
				conjuncts.push(combineWhereAnd(andObligations))
			}
		}
		if (currentWhere.or) {
			const branches: { source: Input.OptionalWhere; obligation: Input.OptionalWhere; hasGuard: boolean }[] = []
			for (const item of currentWhere.or) {
				if (item) {
					const obligation = collect(item)
					branches.push({ source: item, obligation: obligation.where, hasGuard: obligation.hasGuard })
				}
			}
			if (branches.some(branch => branch.hasGuard)) {
				hasGuard = true
				const alternatives = branches.map(branch => branch.hasGuard ? branch.obligation : branch.source)
				const orObligation = alternatives.some(alternative => Object.keys(alternative).length === 0)
					? {}
					: alternatives.length === 1
					? alternatives[0]
					: { or: alternatives }
				conjuncts.push(orObligation)
			}
		}
		if (currentWhere.not) {
			const obligation = collect(currentWhere.not)
			if (obligation.hasGuard) {
				hasGuard = true
				conjuncts.push(obligation.where)
			}
		}
		for (const fieldName of Object.keys(currentWhere)) {
			if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
				continue
			}
			const fieldWhere = currentWhere[fieldName]
			directFieldNames.push(fieldName)
			if (!isOptionalWhere(fieldWhere)) {
				continue
			}
			const nestedGuard = acceptFieldVisitor<Input.OptionalWhere | null>(schema, entity, fieldName, {
				visitColumn: () => null,
				visitRelation: nestedContext => {
					// Structured field guards supply cell predicates per branch, so this resolver contributes only the target row guard.
					const nestedTargetGuard = relationGuard.create(nestedContext, fieldGuard === undefined ? fieldWhere : {}, traversedRelationPath)
					const nestedObligation = createGuardObligationWhere(
						schema,
						nestedContext.targetEntity,
						fieldWhere,
						nestedTargetGuard,
						relationGuard,
						[...traversedRelationPath, nestedContext],
						fieldGuard,
					)
					return Object.keys(nestedObligation).length === 0 ? null : { [fieldName]: nestedObligation }
				},
			})
			if (nestedGuard !== null) {
				hasGuard = true
				conjuncts.push(nestedGuard)
			}
		}
		if (fieldGuard !== undefined && directFieldNames.length > 0) {
			const directFieldGuard = fieldGuard.create(entity, directFieldNames, traversedRelationPath)
			if (Object.keys(directFieldGuard).length > 0) {
				hasGuard = true
				conjuncts.push(directFieldGuard)
			}
		}
		return { where: combineWhereAnd(conjuncts), hasGuard }
	}
	const nestedObligation = collect(where)
	return combineWhereAnd([targetGuard, nestedObligation.where])
}
