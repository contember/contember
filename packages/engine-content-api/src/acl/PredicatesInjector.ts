import { Acl, Input, Model, Writable } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { PredicateFactory } from './PredicateFactory.js'

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
		const restrictedWhere = this.injectToWhere(where, entity, true, relationContext, false, ancestorPath ?? [], isQueryRoot)
		return this.createWhere(entity, undefined, restrictedWhere, true, relationContext, false, ancestorPath ?? [], isQueryRoot)
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
		hasEvaluatedAncestorWitness = false,
	): boolean {
		const isBackReference = this.findBackReferencedAncestor(
			ancestorPath,
			relationContext.relation.name,
			relationContext.entity.name,
		) !== undefined
		return isBackReference && (hasEvaluatedAncestorWitness || PredicatesInjector.toOneBackReferenceTypes.has(relationContext.type))
	}

	private isAlwaysTruePrimaryWhere(where: Input.OptionalWhere, primary: string): boolean {
		const condition = where[primary]
		return Object.keys(where).length === 1
			&& condition !== null
			&& typeof condition === 'object'
			&& !Array.isArray(condition)
			&& 'always' in condition
			&& condition.always === true
	}

	private createWhere(
		entity: Model.Entity,
		fieldNames: string[] | undefined,
		where: Input.OptionalWhere,
		isRoot: boolean,
		relationContext?: Model.AnyRelationContext,
		isBackReferenceContext?: boolean,
		ancestorPath?: readonly Model.AnyRelationContext[],
		isQueryRoot?: boolean,
	): Input.OptionalWhere {
		// Simplify predicates when:
		// 1. We're in a back-reference context (inside a filter that traverses back)
		// 2. AND the back-hop is to-one — a to-many back-hop reaches unreadable siblings, so its row
		//    predicate must be kept (see toOneBackReferenceTypes)
		// 3. AND the relation we traversed to get here corresponds to a relation in our query path
		//    (not just any relation to the same entity type)
		const shouldSimplify = isBackReferenceContext === true
			&& ancestorPath !== undefined
			&& relationContext !== undefined
			&& this.canSimplifyBackReference(ancestorPath, relationContext)

		// An entity is treated as a query root (consulting root-only permissions) only when it is both the
		// root of this injection and `isQueryRoot`. A nested relation target is reached THROUGH a relation,
		// so it must consult the `all` permission set (`isRoot = false`), otherwise a through-only target
		// resolves to its restrictive root predicate (e.g. `{ primary: never }`) and the relation cannot be
		// filtered/read at all. `isQueryRoot === undefined` (callers not tracking it) is preserved as-is.
		const effectiveIsRoot = isRoot ? isQueryRoot : false

		// The back-referenced ancestor only guarantees the row-level (primary) predicate,
		// so only that part can be simplified away. Cell-level predicates of the fields
		// being filtered on must still be enforced, otherwise filtering on a field with
		// a stricter read predicate would leak its value through row presence. Whether a field
		// is cell-level is decided against the same (effective) permission context the predicate
		// is built from, so the two stay consistent under through-access.
		const effectiveFieldNames = shouldSimplify
			? (fieldNames ?? []).filter(it => this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, it, effectiveIsRoot))
			: fieldNames

		let predicatesWhere: Input.OptionalWhere
		if (shouldSimplify && effectiveFieldNames?.length === 0) {
			predicatesWhere = { [entity.primary]: { always: true } }
		} else {
			const rawPredicate = this.predicateFactory.create(entity, Acl.Operation.read, effectiveFieldNames, relationContext, effectiveIsRoot)
			// Process the predicate to inject nested entity predicates. The closure stack starts with `entity`
			// because `rawPredicate` IS this entity's own read predicate — re-entering its expansion is a cycle.
			predicatesWhere = this.injectPredicatesToPredicate(
				rawPredicate,
				entity,
				isBackReferenceContext ?? false,
				ancestorPath ?? [],
				new Set([entity.name]),
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
	 * Recursively ACL-close an already-resolved FIELD (cell) read guard, exactly as {@link createWhere}
	 * closes a row predicate. The projection cell mask and the order-key guard build the raw field guard via
	 * `PredicateFactory.buildReadPredicates` (a predicate reference → WHERE) and lower it straight to SQL; that
	 * raw guard has NO target `read` injected, so a guard traversing a relation (e.g. `Employee.salary` readable
	 * only `{dept:{open:true}}`) leaks the traversed row's value when that row is itself unreadable
	 * (`Dept.read = {company:{id:companyVar}}`). Routing the guard through this closure injects `Dept.read` under
	 * the traversal → `{dept:{open:true, company:{id:companyVar}}}`, masking the cell in every state. For a guard
	 * with no relation hops the closure is a structural no-op (byte-identical SQL). `relationPath` is the path
	 * that reached `entity`, used for back-reference detection inside the traversal (mirrors the row path).
	 */
	public closeReadPredicate(
		entity: Model.Entity,
		where: Input.OptionalWhere,
		relationPath: readonly Model.AnyRelationContext[] = [],
	): Input.OptionalWhere {
		return this.injectPredicatesToPredicate(where, entity, false, relationPath, new Set([entity.name]))
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
		targetClosure: ReadonlySet<string>,
	): Input.OptionalWhere {
		const resultWhere: Writable<Input.OptionalWhere> = {}

		if (where.and) {
			resultWhere.and = where.and
				.filter((it): it is Input.Where => !!it)
				.map(it => this.injectPredicatesToPredicate(it, entity, isBackReferenceContext, ancestorPath, targetClosure))
		}
		if (where.or) {
			resultWhere.or = where.or
				.filter((it): it is Input.Where => !!it)
				.map(it => this.injectPredicatesToPredicate(it, entity, isBackReferenceContext, ancestorPath, targetClosure))
		}
		if (where.not) {
			resultWhere.not = this.injectPredicatesToPredicate(where.not, entity, isBackReferenceContext, ancestorPath, targetClosure)
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
					const hasEvaluatedAncestorWitness = this.predicateFactory.isEvaluatedPredicateReplacement(relationWhere)

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
						targetClosure,
					)

					const primaryKey = context.targetEntity.primary
					const nestedIsAlwaysTrue = this.isAlwaysTruePrimaryWhere(processedNestedWhere, primaryKey)

					// Check if we should simplify the target entity's predicate
					const shouldSimplifyNested = nestedIsBackReferenceContext
						&& this.canSimplifyBackReference(nestedAncestorPath, context, hasEvaluatedAncestorWitness)

					// Get target entity's predicate (simplified if back-reference). A relation target reached from
					// within a predicate is always through-access, so it consults the `all` permission set (isRoot=false).
					const targetPredicate = shouldSimplifyNested
						? { [context.targetEntity.primary]: { always: true } }
						: this.closeTargetPredicate(context, nestedIsBackReferenceContext, nestedAncestorPath, targetClosure)

					// Optimization: avoid duplicate { id: always } when both are simplified
					const targetIsAlwaysTrue = this.isAlwaysTruePrimaryWhere(targetPredicate, primaryKey)

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

	/**
	 * The target entity's own read predicate for a relation reached from WITHIN another predicate, recursively
	 * ACL-closed. Historically this was appended RAW via `PredicateFactory.create`, so any relation inside the
	 * target's predicate never had ITS target's predicate injected — a readable-view leak: e.g.
	 * `Parent.read = {room:{name}}` with `Room.read = {building:{code}}` and an independent `Building.read` left
	 * the building's readability unenforced (a parent whose room's building is unreadable stayed visible).
	 *
	 * Closing recurses only through TO-ONE hops (to-many stays legacy, deferred to the to-many slice). A to-one
	 * back-hop that re-reaches a row-gated ancestor is already collapsed to `{primary: always}` by the caller's
	 * `shouldSimplifyNested`, so it never reaches here. `targetClosure` tracks the entities whose predicate is
	 * being expanded up this branch: re-entering one is a genuine ACL cycle (e.g. a to-many round-trip or a
	 * missing-inverse loop), where we fall back to the raw predicate — terminating exactly at the boundary the
	 * pre-existing code stopped at (no infinite recursion, no new error, strictly less leakage than before).
	 */
	private closeTargetPredicate(
		context: Model.AnyRelationContext,
		isBackReferenceContext: boolean,
		ancestorPath: readonly Model.AnyRelationContext[],
		targetClosure: ReadonlySet<string>,
	): Input.OptionalWhere {
		const rawTargetPredicate = this.predicateFactory.create(context.targetEntity, Acl.Operation.read, undefined, context, false)
		const isToOne = PredicatesInjector.toOneBackReferenceTypes.has(context.type)
		if (!isToOne || targetClosure.has(context.targetEntity.name) || Object.keys(rawTargetPredicate).length === 0) {
			return rawTargetPredicate
		}
		const nestedClosure = new Set(targetClosure).add(context.targetEntity.name)
		return this.injectPredicatesToPredicate(rawTargetPredicate, context.targetEntity, isBackReferenceContext, ancestorPath, nestedClosure)
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

		return this.createWhere(entity, fieldsForPredicate, resultWhere, isRoot, relationContext, isBackReferenceContext, ancestorPath, isQueryRoot)
	}
}
