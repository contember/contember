import { Acl, Input, Model, Writable } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { PredicateFactory } from './PredicateFactory.js'

export class PredicatesInjector {
	constructor(private readonly schema: Model.Schema, private readonly predicateFactory: PredicateFactory) {}

	public inject(
		entity: Model.Entity,
		where: Input.OptionalWhere,
		relationContext?: Model.AnyRelationContext,
		ancestorPath?: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		const isQueryRoot = !relationContext && (!ancestorPath || ancestorPath.length === 0)
		const restrictedWhere = this.injectToWhere(where, entity, true, relationContext, false, ancestorPath ?? [], isQueryRoot)
		return this.createWhere(entity, undefined, restrictedWhere, relationContext, false, ancestorPath ?? [], isQueryRoot)
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
		isQueryRoot?: boolean,
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

		// The back-referenced ancestor only guarantees the row-level (primary) predicate,
		// so only that part can be simplified away. Cell-level predicates of the fields
		// being filtered on must still be enforced, otherwise filtering on a field with
		// a stricter read predicate would leak its value through row presence.
		const effectiveFieldNames = shouldSimplify
			? (fieldNames ?? []).filter(it => this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, it, isQueryRoot))
			: fieldNames

		let predicatesWhere: Input.OptionalWhere
		if (shouldSimplify && effectiveFieldNames?.length === 0) {
			predicatesWhere = { [entity.primary]: { always: true } }
		} else {
			predicatesWhere = this.predicateFactory.create(entity, Acl.Operation.read, effectiveFieldNames, relationContext, isQueryRoot)
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

	private injectToWhere(
		where: Input.OptionalWhere,
		entity: Model.Entity,
		isRoot: boolean,
		relationContext: Model.AnyRelationContext | undefined,
		isBackReferenceContext: boolean,
		ancestorPath: readonly Model.AnyRelationContext[],
		isQueryRoot?: boolean,
	): Input.OptionalWhere {
		const resultWhere: Writable<Input.OptionalWhere> = {}
		if (where.and) {
			resultWhere.and = where.and.filter((it): it is Input.Where => !!it).map(it =>
				this.injectToWhere(it, entity, isRoot, relationContext, isBackReferenceContext, ancestorPath, isQueryRoot)
			)
		}
		if (where.or) {
			resultWhere.or = where.or.filter((it): it is Input.Where => !!it).map(it =>
				this.injectToWhere(it, entity, isRoot, relationContext, isBackReferenceContext, ancestorPath, isQueryRoot)
			)
		}
		if (where.not) {
			resultWhere.not = this.injectToWhere(where.not, entity, isRoot, relationContext, isBackReferenceContext, ancestorPath, isQueryRoot)
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
					return this.injectToWhere(relationWhere, context.targetEntity, false, context, nestedIsBackReferenceContext, nestedAncestorPath, isQueryRoot)
				},
			})
		}
		const fieldsForPredicate = !isRoot
			? fields
			: fields.filter(it => this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, it, isQueryRoot))

		return this.createWhere(entity, fieldsForPredicate, resultWhere, relationContext, isBackReferenceContext, ancestorPath, isQueryRoot)
	}
}
