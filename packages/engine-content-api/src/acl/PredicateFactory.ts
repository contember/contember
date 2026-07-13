import { Acl, Input, Model } from '@contember/schema'
import { VariableInjector } from './VariableInjector.js'
import { replaceEvaluatedPredicate } from './EvaluatedPredicateReplacer.js'

const getRowLevelPredicatePseudoField = (entity: Model.Entity) => entity.primary

export interface FieldRequiredPredicate {
	predicate: Acl.Predicate
	isSameAsPrimary: boolean
}

export class PredicateFactory {
	// Request-scoped memoization: a PredicateFactory lives for one ExecutionContainer (one request), where
	// permissions/allPermissions/variables are fixed, so a `create`/`buildPredicates` result depends only on
	// its arguments. During one query these are called repeatedly with identical arguments (every projected
	// field, every order-by key, the injector). The results are treated as immutable by consumers — the same
	// contract VariableInjector already relies on — so returning a shared instance is safe. The key encodes
	// EVERY input (entity, operation/predicate set, field list, the relation context, and which permission set
	// the context resolves to) via JSON so no two distinct inputs can collide onto one entry.
	private readonly createCache = new Map<string, Input.OptionalWhere>()
	private readonly buildCache = new Map<string, Input.OptionalWhere>()
	// Preserve proof provenance; an identical user-authored AST is not an evaluated ancestor witness.
	private readonly evaluatedPredicateReplacements = new WeakSet<Input.OptionalWhere>()

	constructor(
		private readonly permissions: Acl.Permissions,
		private readonly model: Model.Schema,
		private readonly variableInjector: VariableInjector,
		private readonly allPermissions?: Acl.Permissions,
	) {}

	/** Which permission set `getPermissionsForContext` resolves to — part of every cache key. */
	private permissionSetKey(isRoot?: boolean): 'all' | 'root' {
		return isRoot === false && this.allPermissions ? 'all' : 'root'
	}

	/** Complete, collision-free key for a relation context (entity + relation fully determine type/targets). */
	private relationContextKey(relationContext?: Model.AnyRelationContext): string {
		return relationContext ? `${relationContext.entity.name}.${relationContext.relation.name}` : ''
	}

	/**
	 * Selects the appropriate permission set based on query context:
	 * - `isRoot === false` (nested/relation context): uses allPermissions (includes through-only permissions)
	 * - `isRoot === true` or `isRoot === undefined` (root or unknown context): uses root-only permissions
	 *
	 * The `undefined` vs `true` distinction matters: `undefined` is the default for callers
	 * that don't track root context, and must fall through to root permissions for safety.
	 */
	private getPermissionsForContext(isRoot?: boolean): Acl.Permissions {
		if (isRoot === false && this.allPermissions) {
			return this.allPermissions
		}
		return this.permissions
	}

	public getFieldPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldName: string,
		isRoot?: boolean,
	): FieldRequiredPredicate {
		const perms = this.getPermissionsForContext(isRoot)
		const permissions = perms[entity.name]?.operations?.[operation]
		const predicate = permissions?.[fieldName] ?? false
		const rowLevelField = getRowLevelPredicatePseudoField(entity)

		const primaryPredicate = permissions?.[rowLevelField] ?? false
		const isSameAsPrimary = predicate === primaryPredicate

		return {
			isSameAsPrimary,
			predicate,
		}
	}

	/**
	 * The field's read predicate for a given query path. An entity is treated as a query root (root-only
	 * permissions) only when `relationPath` is empty; anything reached through a relation consults the
	 * through-inclusive `all` set. This is the single place that maps a `relationPath` to the read context,
	 * shared by projection (cell masking) and ordering (order-key guarding) so they always agree.
	 */
	public getFieldReadPredicate(
		entity: Model.Entity,
		fieldName: string,
		relationPath: readonly Model.AnyRelationContext[],
	): FieldRequiredPredicate {
		return this.getFieldPredicate(entity, Acl.Operation.read, fieldName, relationPath.length === 0)
	}

	public createReadPredicate(
		entity: Model.Entity,
		fieldNames: readonly string[] | undefined,
		relationPath: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		return this.create(
			entity,
			Acl.Operation.read,
			fieldNames,
			relationPath[relationPath.length - 1],
			relationPath.length === 0,
		)
	}

	public buildReadPredicates(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		relationPath: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		return this.buildPredicates(
			entity,
			predicates,
			relationPath[relationPath.length - 1],
			relationPath.length === 0,
		)
	}

	public isEvaluatedPredicateReplacement(where: Input.OptionalWhere): boolean {
		return this.evaluatedPredicateReplacements.has(where)
	}

	public shouldApplyCellLevelPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.read,
		fieldName: string,
		isRoot?: boolean,
	): boolean {
		const perms = this.getPermissionsForContext(isRoot)
		const rowLevelField = getRowLevelPredicatePseudoField(entity)
		const permissions = perms[entity.name]?.operations?.[operation]
		return permissions?.[fieldName] !== permissions?.[rowLevelField]
	}

	public createDeletePredicate(entity: Model.Entity, relationContext?: Model.AnyRelationContext, isRoot = true) {
		const neverCondition: Input.Where = { [entity.primary]: { never: true } }
		const entityPermissions = this.getPermissionsForContext(isRoot)[entity.name]
		if (!entityPermissions) {
			return neverCondition
		}
		const deletePredicate = entityPermissions.operations.delete
		if (deletePredicate === undefined || deletePredicate === false) {
			return neverCondition
		}
		if (deletePredicate === true) {
			return {}
		}
		return this.buildPredicates(entity, [deletePredicate], relationContext, isRoot)
	}

	public create(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldNames: readonly string[] = [getRowLevelPredicatePseudoField(entity)],
		relationContext?: Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere {
		const cacheKey = JSON.stringify([
			entity.name,
			operation,
			fieldNames,
			this.relationContextKey(relationContext),
			this.permissionSetKey(isRoot),
		])
		const cached = this.createCache.get(cacheKey)
		if (cached !== undefined) {
			return cached
		}
		const result = this.createInternal(entity, operation, fieldNames, relationContext, isRoot)
		this.createCache.set(cacheKey, result)
		return result
	}

	private createInternal(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldNames: readonly string[] = [getRowLevelPredicatePseudoField(entity)],
		relationContext?: Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere {
		const perms = this.getPermissionsForContext(isRoot)
		const entityPermissions: Acl.EntityPermissions = perms[entity.name]
		const neverCondition: Input.Where = { [entity.primary]: { never: true } }

		if (!entityPermissions) {
			return neverCondition
		}

		if (fieldNames === undefined) {
			fieldNames = [getRowLevelPredicatePseudoField(entity)]
		}
		const fieldPermissions = entityPermissions.operations[operation]
		if (fieldPermissions === undefined) {
			return neverCondition
		}
		const operationPredicates = this.getRequiredPredicates(fieldNames, fieldPermissions)
		if (operationPredicates === false) {
			return neverCondition
		}

		return this.buildPredicates(entity, operationPredicates, relationContext, isRoot)
	}

	public buildPredicates(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		relationContext?: Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere {
		const cacheKey = JSON.stringify([
			entity.name,
			predicates,
			this.relationContextKey(relationContext),
			this.permissionSetKey(isRoot),
		])
		const cached = this.buildCache.get(cacheKey)
		if (cached !== undefined) {
			return cached
		}
		const result = this.buildPredicatesInternal(entity, predicates, relationContext, isRoot)
		this.buildCache.set(cacheKey, result)
		return result
	}

	private buildPredicatesInternal(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		relationContext?: Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere {
		const perms = this.getPermissionsForContext(isRoot)
		const entityPermissions: Acl.EntityPermissions = perms[entity.name] ?? {}

		const predicatesWhere: Input.Where[] = predicates.reduce(
			(result: Input.Where[], name: Acl.PredicateReference): Input.Where[] => {
				if (!entityPermissions.predicates[name]) {
					throw new Error(`${entity.name}: Undefined predicate ${name}`)
				}
				const predicateWhere: Input.Where = this.variableInjector.inject(entity, entityPermissions.predicates[name])
				return [...result, predicateWhere]
			},
			[],
		)
		if (predicatesWhere.length === 0) {
			return {}
		}
		const where: Input.Where = predicatesWhere.length === 1 ? predicatesWhere[0] : { and: predicatesWhere }
		return this.optimizePredicates(where, relationContext, isRoot)
	}

	private getRequiredPredicates(
		fieldNames: readonly string[],
		fieldPermissions: Acl.FieldPermissions,
	): Acl.PredicateReference[] | false {
		const predicates: Acl.PredicateReference[] = []
		for (let name of fieldNames) {
			const fieldPredicate = fieldPermissions[name]
			if (fieldPredicate === undefined || fieldPredicate === false) {
				return false
			}
			if (fieldPredicate === true) {
				continue
			}
			if (!predicates.includes(fieldPredicate)) {
				predicates.push(fieldPredicate)
			}
		}
		return predicates
	}

	public optimizePredicates(where: Input.OptionalWhere, relationContext?: Model.AnyRelationContext, isRoot?: boolean) {
		if (!relationContext || !relationContext.targetRelation) {
			return where
		}
		const sourcePredicate = this.create(relationContext.entity, Acl.Operation.read, [relationContext.relation.name], undefined, isRoot)
		if (Object.keys(sourcePredicate).length === 0) {
			return where
		}

		const replacement: Input.OptionalWhere = { [relationContext.entity.primary]: { always: true } }
		this.evaluatedPredicateReplacements.add(replacement)
		return replaceEvaluatedPredicate(where, sourcePredicate, relationContext.targetRelation, replacement)
	}
}
