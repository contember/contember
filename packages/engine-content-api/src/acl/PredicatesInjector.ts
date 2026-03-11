import { Acl, Input, Model, Writable } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { PredicateFactory } from './PredicateFactory'

export class PredicatesInjector {
	constructor(private readonly schema: Model.Schema, private readonly predicateFactory: PredicateFactory) {}

	public inject(
		entity: Model.Entity,
		where: Input.OptionalWhere,
		relationContext?: Model.AnyRelationContext,
		ancestorPath?: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		const restrictedWhere = this.injectToWhere(where, entity, true, relationContext, false, ancestorPath ?? [])
		return this.createWhere(entity, undefined, restrictedWhere, relationContext, false, ancestorPath ?? [])
	}

	/**
	 * Finds an ancestor in the path that matches the given relation as a back-reference.
	 * A match occurs when:
	 * 1. The relation we're traversing has the same name as the inverse (targetRelation) of a relation in the ancestor path
	 * 2. AND the entity where our relation is defined matches the targetEntity in the path
	 *    (to prevent false positives when different entities have relations with the same name)
	 */
	private findBackReferencedAncestor(
		ancestorPath: readonly Model.AnyRelationContext[],
		relationName: string,
		relationSourceEntityName: string,
	): Model.AnyRelationContext | undefined {
		return ancestorPath.find(ctx =>
			ctx.targetRelation?.name === relationName
			&& ctx.targetEntity.name === relationSourceEntityName
		)
	}

	private createWhere(
		entity: Model.Entity,
		fieldNames: string[] | undefined,
		where: Input.OptionalWhere,
		relationContext?: Model.AnyRelationContext,
		isBackReferenceContext?: boolean,
		ancestorPath?: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		// Simplify predicates when:
		// 1. We're in a back-reference context (inside a filter that traverses back)
		// 2. AND the relation we traversed to get here corresponds to a relation in our query path
		// This ensures we only simplify when the traversed relation actually corresponds
		// to a relation in our query path (not just any relation to the same entity type)
		const shouldSimplify = isBackReferenceContext === true
			&& ancestorPath !== undefined
			&& relationContext !== undefined
			&& this.findBackReferencedAncestor(ancestorPath, relationContext.relation.name, relationContext.entity.name) !== undefined

		let predicatesWhere: Input.OptionalWhere
		if (shouldSimplify) {
			predicatesWhere = { [entity.primary]: { always: true } }
		} else {
			const rawPredicate = this.predicateFactory.create(entity, Acl.Operation.read, fieldNames, relationContext)
			// Process the predicate to inject nested entity predicates
			predicatesWhere = this.injectPredicatesToPredicate(
				rawPredicate,
				entity,
				isBackReferenceContext ?? false,
				ancestorPath ?? [],
			)
		}

		const and = [where, predicatesWhere].filter(it => Object.keys(it).length > 0)
		if (and.length === 0) {
			return {}
		}
		if (and.length === 1) {
			return and[0]
		}
		return { and: and }
	}

	/**
	 * Processes a predicate and injects nested entity predicates for any relation traversals.
	 * This ensures that when a predicate like { department: { company: { name: 'Acme' } } }
	 * is used, the predicates of Department and Company are also applied.
	 */
	private injectPredicatesToPredicate(
		where: Input.OptionalWhere,
		entity: Model.Entity,
		isBackReferenceContext: boolean,
		ancestorPath: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		const resultWhere: Writable<Input.OptionalWhere> = {}

		if (where.and) {
			resultWhere.and = where.and
				.filter((it): it is Input.Where => !!it)
				.map(it => this.injectPredicatesToPredicate(it, entity, isBackReferenceContext, ancestorPath))
		}
		if (where.or) {
			resultWhere.or = where.or
				.filter((it): it is Input.Where => !!it)
				.map(it => this.injectPredicatesToPredicate(it, entity, isBackReferenceContext, ancestorPath))
		}
		if (where.not) {
			resultWhere.not = this.injectPredicatesToPredicate(where.not, entity, isBackReferenceContext, ancestorPath)
		}

		const fields = Object.keys(where).filter(it => !['and', 'or', 'not'].includes(it))

		for (const field of fields) {
			resultWhere[field] = acceptFieldVisitor(this.schema, entity, field, {
				visitColumn: () => where[field],
				visitRelation: context => {
					const relationWhere = where[field] as Input.OptionalWhere | null
					if (relationWhere === null) {
						return null
					}

					// Check if this relation is a back-reference to somewhere in our ancestor path
					const isBackReference = this.findBackReferencedAncestor(
						ancestorPath,
						context.relation.name,
						context.entity.name,
					) !== undefined
					const nestedIsBackReferenceContext = isBackReference || isBackReferenceContext
					const nestedAncestorPath: readonly Model.AnyRelationContext[] = [...ancestorPath, context]

					// Recursively process the nested where (always do this to handle deeper nesting)
					const processedNestedWhere = this.injectPredicatesToPredicate(
						relationWhere,
						context.targetEntity,
						nestedIsBackReferenceContext,
						nestedAncestorPath,
					)

					// Check if we should simplify the target entity's predicate
					const shouldSimplifyNested = nestedIsBackReferenceContext
						&& this.findBackReferencedAncestor(nestedAncestorPath, context.relation.name, context.entity.name) !== undefined

					// Get target entity's predicate (simplified if back-reference)
					const targetPredicate = shouldSimplifyNested
						? { [context.targetEntity.primary]: { always: true } }
						: this.predicateFactory.create(context.targetEntity, Acl.Operation.read, undefined, context)

					// Optimization: avoid duplicate { id: always } when both are simplified
					const primaryKey = context.targetEntity.primary
					const nestedIsAlwaysTrue = Object.keys(processedNestedWhere).length === 1
						&& (processedNestedWhere as Record<string, unknown>)[primaryKey] !== undefined
						&& (processedNestedWhere as Record<string, Record<string, unknown>>)[primaryKey]?.always === true
					const targetIsAlwaysTrue = Object.keys(targetPredicate).length === 1
						&& (targetPredicate as Record<string, unknown>)[primaryKey] !== undefined
						&& (targetPredicate as Record<string, Record<string, unknown>>)[primaryKey]?.always === true

					if (nestedIsAlwaysTrue && targetIsAlwaysTrue) {
						return processedNestedWhere
					}

					// Combine the processed nested where with target entity's predicate
					const parts = [processedNestedWhere, targetPredicate].filter(it => Object.keys(it).length > 0)
					if (parts.length === 0) {
						return {}
					}
					if (parts.length === 1) {
						return parts[0]
					}
					return { and: parts }
				},
			})
		}

		return resultWhere
	}

	private injectToWhere(
		where: Input.OptionalWhere,
		entity: Model.Entity,
		isRoot: boolean,
		relationContext: Model.AnyRelationContext | undefined,
		isBackReferenceContext: boolean,
		ancestorPath: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		const resultWhere: Writable<Input.OptionalWhere> = {}
		if (where.and) {
			resultWhere.and = where.and.filter((it): it is Input.Where => !!it).map(it =>
				this.injectToWhere(it, entity, isRoot, relationContext, isBackReferenceContext, ancestorPath)
			)
		}
		if (where.or) {
			resultWhere.or = where.or.filter((it): it is Input.Where => !!it).map(it =>
				this.injectToWhere(it, entity, isRoot, relationContext, isBackReferenceContext, ancestorPath)
			)
		}
		if (where.not) {
			resultWhere.not = this.injectToWhere(where.not, entity, isRoot, relationContext, isBackReferenceContext, ancestorPath)
		}

		const fields = Object.keys(where).filter(it => !['and', 'or', 'not'].includes(it))

		if (fields.length === 0) {
			return resultWhere
		}
		for (let field of fields) {
			resultWhere[field] = acceptFieldVisitor(this.schema, entity, field, {
				visitColumn: () => where[field],
				visitRelation: context => {
					const relationWhere = where[field] as Input.OptionalWhere | null
					if (relationWhere === null) {
						return null
					}
					// Check if this relation is a back-reference to somewhere in our ancestor path
					const isBackReference = this.findBackReferencedAncestor(ancestorPath, context.relation.name, context.entity.name) !== undefined
					// Once we enter a back-reference context, stay in it for nested relations
					const nestedIsBackReferenceContext = isBackReference || isBackReferenceContext
					// Build extended ancestor path for nested traversal
					const nestedAncestorPath: Model.AnyRelationContext[] = [...ancestorPath, context]
					return this.injectToWhere(relationWhere, context.targetEntity, false, context, nestedIsBackReferenceContext, nestedAncestorPath)
				},
			})
		}
		const fieldsForPredicate = !isRoot
			? fields
			: fields.filter(it => this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, it))

		return this.createWhere(entity, fieldsForPredicate, resultWhere, relationContext, isBackReferenceContext, ancestorPath)
	}
}
