import { Acl, Input, Model } from '@contember/schema'
import {
	hasStateMarkers,
	mapStatePredicate,
	parseStatePredicate,
	resolveOldStateProjection,
	resolveSingleStatePredicate,
	StatePredicate,
} from '@contember/schema-utils'
import { VariableInjector } from './VariableInjector.js'
import { EvaluatedPredicateReplacer } from './EvaluatedPredicateReplacer.js'
import { AclScope, aclScopeFromPath } from './AclScope.js'

const getRowLevelPredicatePseudoField = (entity: Model.Entity) => entity.primary

/**
 * How `_old`/`_new` markers resolve outside a real update: `single` for an operation that sees one row,
 * `old` for the old-state projection behind `_meta.<field>.updatable`.
 */
export type PredicateStateView = 'single' | 'old'

export interface FieldRequiredPredicate {
	predicate: Acl.Predicate
	isSameAsPrimary: boolean
}

export class PredicateFactory {
	// Request-scoped memoization: a PredicateFactory lives for one ExecutionContainer (one request), where
	// permissions/nestedPermissions/variables are fixed, so a `create`/`buildPredicates` result depends only on
	// its arguments. During one query these are called repeatedly with identical arguments (every projected
	// field, every order-by key, the injector). The results are treated as immutable by consumers — the same
	// contract VariableInjector already relies on — so returning a shared instance is safe. The key encodes
	// EVERY input (entity, operation/predicate set, field list, the relation context, and which permission set
	// the context resolves to) via JSON so no two distinct inputs can collide onto one entry.
	private readonly createCache = new Map<string, Input.OptionalWhere>()
	private readonly buildCache = new Map<string, Input.OptionalWhere>()
	private readonly updateStateCache = new Map<string, StatePredicate<Input.OptionalWhere>>()
	constructor(
		private readonly permissions: Acl.Permissions,
		private readonly model: Model.Schema,
		private readonly variableInjector: VariableInjector,
		private readonly nestedPermissions?: Acl.Permissions,
	) {}

	/** Which permission set `permissionsFor` resolves to — part of every cache key. */
	private permissionSetKey(scope: AclScope): 'nested' | 'root' {
		return scope === 'nested' && this.nestedPermissions ? 'nested' : 'root'
	}

	/** Complete, collision-free key for a relation context (entity + relation fully determine type/targets). */
	private relationContextKey(relationContext?: Model.AnyRelationContext): string {
		return relationContext ? `${relationContext.entity.name}.${relationContext.relation.name}` : ''
	}

	/**
	 * `nested` uses the permission set that includes `through` grants; `root` uses the root grants
	 * only. The scope is a required argument on every entry point - see {@link AclScope}.
	 *
	 * `nestedPermissions` is optional so that callers with a single flat permission set (tests, the
	 * system API's internal executor) keep working; they simply get the same set for both scopes.
	 */
	private permissionsFor(scope: AclScope): Acl.Permissions {
		if (scope === 'nested' && this.nestedPermissions) {
			return this.nestedPermissions
		}
		return this.permissions
	}

	public getFieldPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldName: string,
		scope: AclScope,
	): FieldRequiredPredicate {
		const perms = this.permissionsFor(scope)
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
	 * through-inclusive nested set. This is the single place that maps a `relationPath` to the read context,
	 * shared by projection (cell masking) and ordering (order-key guarding) so they always agree.
	 */
	public getFieldReadPredicate(
		entity: Model.Entity,
		fieldName: string,
		relationPath: readonly Model.AnyRelationContext[],
	): FieldRequiredPredicate {
		return this.getFieldPredicate(entity, Acl.Operation.read, fieldName, aclScopeFromPath(relationPath))
	}

	public createReadPredicate(
		entity: Model.Entity,
		fieldNames: readonly string[] | undefined,
		relationPath: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		return this.create(
			entity,
			Acl.Operation.read,
			aclScopeFromPath(relationPath),
			fieldNames,
			relationPath[relationPath.length - 1],
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
			aclScopeFromPath(relationPath),
			relationPath[relationPath.length - 1],
		)
	}

	/** The predicate behind `_meta.<field>.updatable`: whether the stored row admits some update (see {@link PredicateStateView}). */
	public buildUpdatablePredicates(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		relationPath: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		return this.buildPredicates(
			entity,
			predicates,
			aclScopeFromPath(relationPath),
			relationPath[relationPath.length - 1],
			'old',
		)
	}

	public hasStateMarkers(entity: Model.Entity, predicate: Acl.PredicateReference, relationPath: readonly Model.AnyRelationContext[]): boolean {
		return hasStateMarkers(this.getPredicateDefinition(entity, predicate, aclScopeFromPath(relationPath)))
	}

	public shouldApplyCellLevelPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.read,
		fieldName: string,
		scope: AclScope,
	): boolean {
		const perms = this.permissionsFor(scope)
		const rowLevelField = getRowLevelPredicatePseudoField(entity)
		const permissions = perms[entity.name]?.operations?.[operation]
		return permissions?.[fieldName] !== permissions?.[rowLevelField]
	}

	public createDeletePredicate(entity: Model.Entity, scope: AclScope) {
		const neverCondition: Input.Where = { [entity.primary]: { never: true } }
		const entityPermissions = this.permissionsFor(scope)[entity.name]
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
		return this.buildPredicates(entity, [deletePredicate], scope)
	}

	public create(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		scope: AclScope,
		fieldNames: readonly string[] = [getRowLevelPredicatePseudoField(entity)],
		relationContext?: Model.AnyRelationContext,
	): Input.OptionalWhere {
		const cacheKey = JSON.stringify([
			entity.name,
			operation,
			fieldNames,
			this.relationContextKey(relationContext),
			this.permissionSetKey(scope),
		])
		const cached = this.createCache.get(cacheKey)
		if (cached !== undefined) {
			return cached
		}
		const result = this.createInternal(entity, operation, scope, fieldNames, relationContext)
		this.createCache.set(cacheKey, result)
		return result
	}

	private createInternal(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		scope: AclScope,
		fieldNames: readonly string[] = [getRowLevelPredicatePseudoField(entity)],
		relationContext?: Model.AnyRelationContext,
	): Input.OptionalWhere {
		const operationPredicates = this.getOperationPredicates(entity, operation, scope, fieldNames)
		if (operationPredicates === false) {
			return { [entity.primary]: { never: true } }
		}

		return this.buildPredicates(entity, operationPredicates, scope, relationContext)
	}

	/**
	 * The update predicate of `fieldNames` over the stored and the proposed row. Without `_old`/`_new` markers it
	 * is a single `both` node holding exactly what {@link create} returns.
	 */
	public createUpdateStatePredicate(entity: Model.Entity, scope: AclScope, fieldNames: readonly string[]): StatePredicate<Input.OptionalWhere> {
		const cacheKey = JSON.stringify([entity.name, fieldNames, this.permissionSetKey(scope)])
		const cached = this.updateStateCache.get(cacheKey)
		if (cached !== undefined) {
			return cached
		}
		const result = this.createUpdateStatePredicateInternal(entity, scope, fieldNames)
		this.updateStateCache.set(cacheKey, result)
		return result
	}

	private createUpdateStatePredicateInternal(
		entity: Model.Entity,
		scope: AclScope,
		fieldNames: readonly string[],
	): StatePredicate<Input.OptionalWhere> {
		const operationPredicates = this.getOperationPredicates(entity, Acl.Operation.update, scope, fieldNames)
		const definitions = operationPredicates === false ? [] : operationPredicates.map(it => this.getPredicateDefinition(entity, it, scope))
		if (!definitions.some(hasStateMarkers)) {
			return { type: 'both', predicate: this.create(entity, Acl.Operation.update, scope, fieldNames) }
		}
		const operands = definitions.map(definition => mapStatePredicate(parseStatePredicate(definition), it => this.variableInjector.inject(entity, it)))
		return operands.length === 1 ? operands[0] : { type: 'and', operands }
	}

	private getOperationPredicates(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		scope: AclScope,
		fieldNames: readonly string[],
	): Acl.PredicateReference[] | false {
		const fieldPermissions = this.permissionsFor(scope)[entity.name]?.operations[operation]
		if (fieldPermissions === undefined) {
			return false
		}
		return this.getRequiredPredicates(fieldNames, fieldPermissions)
	}

	private getPredicateDefinition(entity: Model.Entity, name: Acl.PredicateReference, scope: AclScope): Acl.PredicateDefinition {
		const definition = this.permissionsFor(scope)[entity.name]?.predicates[name]
		if (!definition) {
			throw new Error(`${entity.name}: Undefined predicate ${name}`)
		}
		return definition
	}

	public buildPredicates(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		scope: AclScope,
		relationContext?: Model.AnyRelationContext,
		view: PredicateStateView = 'single',
	): Input.OptionalWhere {
		const cacheKey = JSON.stringify([
			entity.name,
			predicates,
			this.relationContextKey(relationContext),
			this.permissionSetKey(scope),
			view,
		])
		const cached = this.buildCache.get(cacheKey)
		if (cached !== undefined) {
			return cached
		}
		const result = this.buildPredicatesInternal(entity, predicates, scope, view, relationContext)
		this.buildCache.set(cacheKey, result)
		return result
	}

	private buildPredicatesInternal(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		scope: AclScope,
		view: PredicateStateView,
		relationContext?: Model.AnyRelationContext,
	): Input.OptionalWhere {
		const resolveStates = view === 'single' ? resolveSingleStatePredicate : resolveOldStateProjection
		const predicatesWhere: Input.Where[] = predicates.map(name =>
			this.variableInjector.inject(entity, resolveStates(this.getPredicateDefinition(entity, name, scope)))
		)
		if (predicatesWhere.length === 0) {
			return {}
		}
		const where: Input.Where = predicatesWhere.length === 1 ? predicatesWhere[0] : { and: predicatesWhere }
		return this.optimizePredicates(where, scope, relationContext)
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

	public optimizePredicates(where: Input.OptionalWhere, scope: AclScope, relationContext?: Model.AnyRelationContext) {
		if (!relationContext || !relationContext.targetRelation) {
			return where
		}
		const sourcePredicate = this.create(relationContext.entity, Acl.Operation.read, scope, [relationContext.relation.name])
		if (Object.keys(sourcePredicate).length === 0) {
			return where
		}

		const replacer = new EvaluatedPredicateReplacer(sourcePredicate, relationContext.entity, relationContext.targetRelation)
		return replacer.replace(where)
	}
}
