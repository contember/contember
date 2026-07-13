import { Acl, Input, Model, Writable } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import deepEqual from 'fast-deep-equal'
import {
	createPredicateContext,
	createPredicateContextForEvaluatedRelationPath,
	createPredicateContextWithEvaluatedRelationPath,
	getEvaluatedRelationPath,
	PredicateContext,
	PredicatePermissionScope,
	rootPredicateContext,
} from './PredicateContext.js'
import { PredicateInjection, RelationPredicateGuard } from './PredicateInjection.js'
import { PredicateFactory } from './PredicateFactory.js'
import { createGuardObligationWhere, FieldPredicateGuard } from './RelationGuardMaterializer.js'

const rootQueryPredicateContext = createPredicateContextForEvaluatedRelationPath([])

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

	/**
	 * Produces a read-filter ingress which keeps relation-local ACL guards distinct from user boolean
	 * expressions. In particular, a target read guard must not become an operand of user `not`.
	 */
	public injectForRead(
		entity: Model.Entity,
		where: Input.OptionalWhere,
		context: PredicateContext = rootQueryPredicateContext,
	): PredicateInjection {
		const initialRelationPath = getEvaluatedRelationPath(context) ?? []
		const rootGuard = this.createReadGuard(
			entity,
			this.collectReferencedFields(entity, where),
			true,
			undefined,
			initialRelationPath,
			context,
		)
		const relationGuard = this.createRelationGuard(context, initialRelationPath)
		return { where, guard: rootGuard, relationGuard }
	}

	public inject(
		entity: Model.Entity,
		where: Input.OptionalWhere,
		context?: PredicateContext,
	): Input.OptionalWhere
	/** @deprecated Pass a PredicateContext with an evaluated relation path instead. */
	public inject(
		entity: Model.Entity,
		where: Input.OptionalWhere,
		relationContext?: Model.AnyRelationContext,
		ancestorPath?: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere
	public inject(
		entity: Model.Entity,
		where: Input.OptionalWhere,
		contextOrRelation: PredicateContext | Model.AnyRelationContext = rootQueryPredicateContext,
		legacyAncestorPath?: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		const isLegacyCall = legacyAncestorPath !== undefined || !this.isPredicateContext(contextOrRelation)
		const legacyRelationContext = isLegacyCall && !this.isPredicateContext(contextOrRelation) ? contextOrRelation : undefined
		const ancestorPath = isLegacyCall ? legacyAncestorPath ?? [] : getEvaluatedRelationPath(contextOrRelation) ?? []
		const relationContext = isLegacyCall ? legacyRelationContext : ancestorPath[ancestorPath.length - 1]
		const context = isLegacyCall
			? relationContext === undefined
				? createPredicateContext(ancestorPath.length === 0 ? 'root' : 'through')
				: createPredicateContextWithEvaluatedRelationPath('through', [relationContext])
			: contextOrRelation
		const initialRelationPath = getEvaluatedRelationPath(context) ?? []
		const relationGuard = this.createRelationGuard(context, initialRelationPath)
		const fieldGuard = this.createFieldGuard(context, relationContext, ancestorPath)
		const restrictedWhere = this.injectToWhere(where, entity, true, relationContext, false, ancestorPath, context, relationGuard, fieldGuard, [], {})
		const injectedWhere = this.createWhere(entity, undefined, restrictedWhere, true, relationContext, false, ancestorPath, context)
		return injectedWhere
	}

	private createRelationGuard(
		context: PredicateContext,
		initialRelationPath: readonly Model.AnyRelationContext[],
	): RelationPredicateGuard {
		return {
			create: (relationContext, relationWhere, traversedRelationPath) =>
				this.createReadGuard(
					relationContext.targetEntity,
					this.collectReferencedFields(relationContext.targetEntity, relationWhere),
					false,
					relationContext,
					[...initialRelationPath, ...traversedRelationPath, relationContext],
					context,
				),
		}
	}

	private createFieldGuard(
		context: PredicateContext,
		rootRelationContext: Model.AnyRelationContext | undefined,
		rootAncestorPath: readonly Model.AnyRelationContext[],
	): FieldPredicateGuard {
		return {
			create: (entity, fieldNames, traversedRelationPath) => {
				const isRoot = traversedRelationPath.length === 0
				const relationContext = isRoot ? rootRelationContext : traversedRelationPath[traversedRelationPath.length - 1]
				const effectiveScope: PredicatePermissionScope = isRoot ? context.scope : 'through'
				const effectiveFieldNames = fieldNames.filter(fieldName =>
					this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, fieldName, effectiveScope)
				)
				if (effectiveFieldNames.length === 0) {
					return {}
				}
				const predicateContext = isRoot
					? context
					: relationContext !== undefined && getEvaluatedRelationPath(context) !== undefined
					? createPredicateContextForEvaluatedRelationPath([relationContext])
					: createPredicateContext(effectiveScope)
				const fieldPredicate = this.predicateFactory.create(entity, Acl.Operation.read, effectiveFieldNames, predicateContext)
				return this.injectPredicatesToPredicate(fieldPredicate, entity, false, [...rootAncestorPath, ...traversedRelationPath])
			},
		}
	}

	private isPredicateContext(value: PredicateContext | Model.AnyRelationContext): value is PredicateContext {
		return 'scope' in value
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

	private collectReferencedFields(entity: Model.Entity, where: Input.OptionalWhere): string[] {
		const fields = new Set<string>()
		const visit = (currentWhere: Input.OptionalWhere): void => {
			if (currentWhere.and) {
				for (const item of currentWhere.and) {
					if (item) {
						visit(item)
					}
				}
			}
			if (currentWhere.or) {
				for (const item of currentWhere.or) {
					if (item) {
						visit(item)
					}
				}
			}
			if (currentWhere.not) {
				visit(currentWhere.not)
			}
			for (const fieldName of Object.keys(currentWhere)) {
				if (fieldName !== 'and' && fieldName !== 'or' && fieldName !== 'not' && entity.fields[fieldName] !== undefined) {
					fields.add(fieldName)
				}
			}
		}
		visit(where)
		return [...fields]
	}

	private createReadGuard(
		entity: Model.Entity,
		fieldNames: readonly string[],
		isRoot: boolean,
		relationContext: Model.AnyRelationContext | undefined,
		ancestorPath: readonly Model.AnyRelationContext[],
		context: PredicateContext,
	): Input.OptionalWhere {
		const effectiveScope: PredicatePermissionScope = isRoot ? context.scope : 'through'
		const shouldSimplify = !isRoot
			&& relationContext !== undefined
			&& this.canSimplifyBackReference(ancestorPath, relationContext)
		const effectiveFieldNames = fieldNames.filter(fieldName =>
			this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, fieldName, effectiveScope)
		)
		const predicateContext = isRoot
			? context
			: relationContext !== undefined && getEvaluatedRelationPath(context) !== undefined
			? createPredicateContextForEvaluatedRelationPath([relationContext])
			: createPredicateContext(effectiveScope)

		if (shouldSimplify && effectiveFieldNames.length === 0) {
			return { [entity.primary]: { always: true } }
		}
		const predicates = shouldSimplify
			? [this.predicateFactory.create(entity, Acl.Operation.read, effectiveFieldNames, predicateContext)]
			: [
				this.predicateFactory.create(entity, Acl.Operation.read, [entity.primary], predicateContext),
				...(effectiveFieldNames.length > 0
					? [this.predicateFactory.create(entity, Acl.Operation.read, effectiveFieldNames, predicateContext)]
					: []),
			]
		const nonEmpty = predicates
			.filter(predicate => Object.keys(predicate).length > 0)
			.map(predicate => this.injectPredicatesToPredicate(predicate, entity, false, ancestorPath))
		return nonEmpty.length === 0 ? {} : nonEmpty.length === 1 ? nonEmpty[0] : { and: nonEmpty }
	}

	private createWhere(
		entity: Model.Entity,
		fieldNames: string[] | undefined,
		where: Input.OptionalWhere,
		isRoot: boolean,
		relationContext?: Model.AnyRelationContext,
		isBackReferenceContext?: boolean,
		ancestorPath?: readonly Model.AnyRelationContext[],
		context: PredicateContext = rootPredicateContext,
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

		// A nested relation target always uses through permissions. A query traversal may add the current
		// relation as a witness; mutation access has no witness and therefore cannot do so.
		const effectiveScope: PredicatePermissionScope = isRoot ? context.scope : 'through'
		const permissionContext = createPredicateContext(effectiveScope)
		const relationPath = getEvaluatedRelationPath(context)
		const predicateContext = isRoot
			? context
			: relationPath !== undefined && relationContext !== undefined
			? createPredicateContextForEvaluatedRelationPath([relationContext])
			: permissionContext

		// The back-referenced ancestor only guarantees the row-level (primary) predicate,
		// so only that part can be simplified away. Cell-level predicates of the fields
		// being filtered on must still be enforced, otherwise filtering on a field with
		// a stricter read predicate would leak its value through row presence. Whether a field
		// is cell-level is decided against the same (effective) permission context the predicate
		// is built from, so the two stay consistent under through-access.
		const effectiveFieldNames = shouldSimplify
			? (fieldNames ?? []).filter(it => this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, it, effectiveScope))
			: fieldNames

		let predicatesWhere: Input.OptionalWhere
		if (shouldSimplify && effectiveFieldNames?.length === 0) {
			predicatesWhere = { [entity.primary]: { always: true } }
		} else {
			const rawPredicate = this.predicateFactory.create(entity, Acl.Operation.read, effectiveFieldNames, predicateContext)
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
				visitRelation: relationContext => {
					const relationWhere = where[field] as Input.OptionalWhere | null
					if (relationWhere === null) {
						return null
					}
					const hasEvaluatedAncestorWitness = this.predicateFactory.isEvaluatedPredicateReplacement(relationWhere)

					// Check if this relation is a back-reference to somewhere in our ancestor path
					const isBackReference = this.findBackReferencedAncestor(
						ancestorPath,
						relationContext.relation.name,
						relationContext.entity.name,
					) !== undefined
					const nestedIsBackReferenceContext = isBackReference || isBackReferenceContext
					const nestedAncestorPath: readonly Model.AnyRelationContext[] = [...ancestorPath, relationContext]

					// Recursively process the nested where (always do this to handle deeper nesting)
					const processedNestedWhere = this.injectPredicatesToPredicate(
						relationWhere,
						relationContext.targetEntity,
						nestedIsBackReferenceContext,
						nestedAncestorPath,
					)

					const primaryKey = relationContext.targetEntity.primary
					const nestedIsAlwaysTrue = this.isAlwaysTruePrimaryWhere(processedNestedWhere, primaryKey)

					// Check if we should simplify the target entity's predicate
					const shouldSimplifyNested = nestedIsBackReferenceContext
						&& this.canSimplifyBackReference(nestedAncestorPath, relationContext, hasEvaluatedAncestorWitness)

					// Get target entity's predicate (simplified if back-reference). A relation target reached from
					// within a predicate is always through-access, so it consults the `all` permission set (isRoot=false).
					const rawTargetPredicate = shouldSimplifyNested
						? { [relationContext.targetEntity.primary]: { always: true } }
						: this.predicateFactory.create(relationContext.targetEntity, Acl.Operation.read, undefined, createPredicateContext('through'))
					const targetPredicate = this.injectPredicatesToPredicate(
						rawTargetPredicate,
						relationContext.targetEntity,
						nestedIsBackReferenceContext,
						nestedAncestorPath,
					)

					// Optimization: avoid duplicate { id: always } when both are simplified
					const targetIsAlwaysTrue = this.isAlwaysTruePrimaryWhere(targetPredicate, primaryKey)

					if (nestedIsAlwaysTrue && targetIsAlwaysTrue) {
						return processedNestedWhere
					}

					// Combine the processed nested where with target entity's predicate
					const parts = [processedNestedWhere, targetPredicate]
						.filter(it => Object.keys(it).length > 0)
						.filter((part, index, all) => all.findIndex(candidate => deepEqual(candidate, part)) === index)
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
		context: PredicateContext,
		relationGuard: RelationPredicateGuard,
		fieldGuard: FieldPredicateGuard,
		traversedRelationPath: readonly Model.AnyRelationContext[],
		currentTargetGuard: Input.OptionalWhere,
	): Input.OptionalWhere {
		const resultWhere: Writable<Input.OptionalWhere> = {}
		if (where.and) {
			resultWhere.and = where.and.filter((it): it is Input.Where => !!it).map(it =>
				this.injectToWhere(
					it,
					entity,
					isRoot,
					relationContext,
					isBackReferenceContext,
					ancestorPath,
					context,
					relationGuard,
					fieldGuard,
					traversedRelationPath,
					currentTargetGuard,
				)
			)
		}
		if (where.or) {
			resultWhere.or = where.or.filter((it): it is Input.Where => !!it).map(it =>
				this.injectToWhere(
					it,
					entity,
					isRoot,
					relationContext,
					isBackReferenceContext,
					ancestorPath,
					context,
					relationGuard,
					fieldGuard,
					traversedRelationPath,
					currentTargetGuard,
				)
			)
		}
		if (where.not) {
			const injectedNot = this.injectToWhere(
				where.not,
				entity,
				isRoot,
				relationContext,
				isBackReferenceContext,
				ancestorPath,
				context,
				relationGuard,
				fieldGuard,
				traversedRelationPath,
				currentTargetGuard,
			)
			// Use the raw operand so ACL-internal predicate fields never become user probes.
			const obligation = createGuardObligationWhere(
				this.schema,
				entity,
				where.not,
				isRoot ? {} : currentTargetGuard,
				relationGuard,
				traversedRelationPath,
				fieldGuard,
			)
			if (Object.keys(obligation).length === 0) {
				resultWhere.not = injectedNot
			} else {
				resultWhere.and = [...resultWhere.and ?? [], { not: injectedNot }, obligation]
			}
		}

		const fields = Object.keys(where).filter(it => !['and', 'or', 'not'].includes(it))

		if (fields.length === 0) {
			return resultWhere
		}
		for (let field of fields) {
			resultWhere[field] = acceptFieldVisitor(this.schema, entity, field, {
				visitColumn: () => where[field],
				visitRelation: nestedRelationContext => {
					const relationWhere = where[field] as Input.OptionalWhere | null
					if (relationWhere === null) {
						return null
					}
					// Check if this relation is a back-reference to somewhere in our ancestor path
					const isBackReference = this.findBackReferencedAncestor(
						ancestorPath,
						nestedRelationContext.relation.name,
						nestedRelationContext.entity.name,
					) !== undefined
					// Once we enter a back-reference context, stay in it for nested relations
					const nestedIsBackReferenceContext = isBackReference || isBackReferenceContext
					// Build extended ancestor path for nested traversal
					const nestedAncestorPath: Model.AnyRelationContext[] = [...ancestorPath, nestedRelationContext]
					const nestedTargetGuard = relationGuard.create(nestedRelationContext, {}, traversedRelationPath)
					return this.injectToWhere(
						relationWhere,
						nestedRelationContext.targetEntity,
						false,
						nestedRelationContext,
						nestedIsBackReferenceContext,
						nestedAncestorPath,
						context,
						relationGuard,
						fieldGuard,
						[...traversedRelationPath, nestedRelationContext],
						nestedTargetGuard,
					)
				},
			})
		}
		const fieldsForPredicate = !isRoot
			? fields
			: fields.filter(it => this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, it, context.scope))

		return this.createWhere(entity, fieldsForPredicate, resultWhere, isRoot, relationContext, isBackReferenceContext, ancestorPath, context)
	}
}
