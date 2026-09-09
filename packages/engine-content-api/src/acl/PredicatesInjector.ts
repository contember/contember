import { Acl, Input, Model, Writable } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { PredicateFactory } from './PredicateFactory.js'

/**
 * Internal where key carrying the row-level read predicate of a relation target. The injector attaches it
 * to every user-authored relation hop; the WhereBuilder compiles it into the hop's table source (a guarded
 * join / subquery), so an unreadable related row null-extends exactly like an absent one under any boolean
 * shape. `$` cannot appear in a GraphQL name, so the key can never arrive from user input.
 */
export const READ_GUARD_KEY = '$readGuard'

const isWhere = (value: Input.OptionalWhere[string]): value is Input.OptionalWhere =>
	value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)

/** Separates the hop's read guard from the user-authored remainder; the guard is empty when absent. */
export const splitReadGuard = (where: Input.OptionalWhere): { guard: Input.OptionalWhere; where: Input.OptionalWhere } => {
	const { [READ_GUARD_KEY]: guard, ...rest } = where
	return { guard: isWhere(guard) ? guard : {}, where: rest }
}

export class PredicatesInjector {
	/**
	 * Back-reference simplification is only sound for to-one back-hops. A to-one round-trip
	 * re-reaches the exact ancestor row (already verified readable), so its predicate can be dropped.
	 * A to-many back-hop reaches the ancestor's SIBLINGS, which are NOT guaranteed readable — dropping
	 * their row predicate would leak a value/presence oracle over unreadable rows. Fail-closed: only the
	 * types listed here simplify; anything else keeps the full predicate.
	 */
	private static readonly toOneBackReferenceTypes = new Set<Model.AnyRelationContext['type']>([
		'manyHasOne',
		'oneHasOneOwning',
		'oneHasOneInverse',
	])

	constructor(private readonly schema: Model.Schema, private readonly predicateFactory: PredicateFactory) {}

	public inject(
		entity: Model.Entity,
		where: Input.OptionalWhere,
		relationContext?: Model.AnyRelationContext,
		ancestorPath?: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		const isQueryRoot = !relationContext && (!ancestorPath || ancestorPath.length === 0)
		const restrictedWhere = this.injectToWhere(where, entity, true, relationContext, ancestorPath ?? [], isQueryRoot)
		return this.createWhere(entity, undefined, restrictedWhere, relationContext, isQueryRoot)
	}

	/**
	 * Row-level read predicate guarding a relation hop's target (the `all` permission set, since the target
	 * is reached through a relation). Empty when the target is freely readable, or when the hop is a to-one
	 * back-reference to an ancestor row that is already verified readable. Shared by the filter injection
	 * and the order-by join so both guard the same hop identically (they share the join alias).
	 */
	public createReadGuard(relationContext: Model.AnyRelationContext, ancestorPath: readonly Model.AnyRelationContext[]): Input.OptionalWhere {
		if (this.canSimplifyBackReference(ancestorPath, relationContext)) {
			return {}
		}
		return this.predicateFactory.create(relationContext.targetEntity, Acl.Operation.read, undefined, relationContext, false)
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

	private canSimplifyBackReference(
		ancestorPath: readonly Model.AnyRelationContext[],
		relationContext: Model.AnyRelationContext,
	): boolean {
		const isBackReference = this.findBackReferencedAncestor(
			ancestorPath,
			relationContext.relation.name,
			relationContext.entity.name,
		) !== undefined
		return isBackReference && PredicatesInjector.toOneBackReferenceTypes.has(relationContext.type)
	}

	/**
	 * ANDs the read predicates of `fieldNames` (cell-level guards) onto `where`. With `fieldNames`
	 * undefined this is the row-level predicate of the injection root — the only place the row predicate
	 * lands in the WHERE; relation targets carry theirs in `READ_GUARD_KEY` instead.
	 */
	private createWhere(
		entity: Model.Entity,
		fieldNames: string[] | undefined,
		where: Input.OptionalWhere,
		relationContext: Model.AnyRelationContext | undefined,
		isQueryRoot: boolean | undefined,
	): Input.OptionalWhere {
		// A nested relation target is reached THROUGH a relation, so it consults the `all` permission set
		// (`isRoot = false`). `isQueryRoot === undefined` (callers not tracking it) is preserved as-is.
		const predicatesWhere = this.predicateFactory.create(entity, Acl.Operation.read, fieldNames, relationContext, isQueryRoot)

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
		ancestorPath: readonly Model.AnyRelationContext[],
		isQueryRoot: boolean | undefined,
	): Input.OptionalWhere {
		const resultWhere: Writable<Input.OptionalWhere> = {}
		if (where.and) {
			resultWhere.and = where.and.filter((it): it is Input.Where => !!it).map(it =>
				this.injectToWhere(it, entity, isRoot, relationContext, ancestorPath, isQueryRoot)
			)
		}
		if (where.or) {
			resultWhere.or = where.or.filter((it): it is Input.Where => !!it).map(it =>
				this.injectToWhere(it, entity, isRoot, relationContext, ancestorPath, isQueryRoot)
			)
		}
		if (where.not) {
			resultWhere.not = this.injectToWhere(where.not, entity, isRoot, relationContext, ancestorPath, isQueryRoot)
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
					const nestedAncestorPath: Model.AnyRelationContext[] = [...ancestorPath, context]
					const nestedWhere = this.injectToWhere(relationWhere, context.targetEntity, false, context, nestedAncestorPath, false)
					const guard = this.createReadGuard(context, ancestorPath)
					if (Object.keys(guard).length === 0) {
						return nestedWhere
					}
					return { ...nestedWhere, [READ_GUARD_KEY]: guard }
				},
			})
		}
		// Only cell-level fields (a read predicate stricter than the row-level one) need a guard next to their
		// condition; the row-level predicate is enforced once — in the WHERE of the injection root, or in the
		// guarded join of a relation hop.
		const fieldsForPredicate = fields.filter(it =>
			this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, it, isRoot ? isQueryRoot : false)
		)

		return this.createWhere(entity, fieldsForPredicate, resultWhere, relationContext, isRoot ? isQueryRoot : false)
	}
}
