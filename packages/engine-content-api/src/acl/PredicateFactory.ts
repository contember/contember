import { Acl, Input, Model } from '@contember/schema'
import {
	createPredicateContext,
	createPredicateContextForEvaluatedRelationPath,
	createPredicateContextWithEvaluatedRelationPath,
	getEvaluatedRelationPath,
	PredicateContext,
	PredicatePermissionScope,
	rootPredicateContext,
} from './PredicateContext.js'
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
	private permissionSetKey(context: PredicateContext): 'all' | 'root' {
		return context.scope === 'through' && this.allPermissions ? 'all' : 'root'
	}

	/** Complete, collision-free key for the evaluated relation witness. */
	private evaluatedRelationPathKey(context: PredicateContext): string {
		const relationPath = getEvaluatedRelationPath(context)
		return relationPath ? relationPath.map(it => `${it.entity.name}.${it.relation.name}`).join('/') : ''
	}

	/**
	 * Selects the appropriate permission set. The permission scope is intentionally independent
	 * from an evaluated relation witness: mutations need the former but never have the latter.
	 */
	private getPermissionsForContext(context: PredicateContext): Acl.Permissions {
		if (context.scope === 'through' && this.allPermissions) {
			return this.allPermissions
		}
		return this.permissions
	}

	private normalizeScope(scopeOrIsRoot: PredicatePermissionScope | boolean | undefined): PredicatePermissionScope {
		if (typeof scopeOrIsRoot === 'boolean') {
			return scopeOrIsRoot ? 'root' : 'through'
		}
		return scopeOrIsRoot ?? 'root'
	}

	private normalizeContext(
		contextOrRelation: PredicateContext | Model.AnyRelationContext | undefined,
		isRoot?: boolean,
	): PredicateContext {
		if (contextOrRelation === undefined) {
			return createPredicateContext(this.normalizeScope(isRoot))
		}
		if ('scope' in contextOrRelation) {
			return contextOrRelation
		}
		return createPredicateContextWithEvaluatedRelationPath(this.normalizeScope(isRoot), [contextOrRelation])
	}

	public getFieldPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldName: string,
		scope?: PredicatePermissionScope,
	): FieldRequiredPredicate
	public getFieldPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldName: string,
		isRoot?: boolean,
	): FieldRequiredPredicate
	public getFieldPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldName: string,
		scopeOrIsRoot: PredicatePermissionScope | boolean = 'root',
	): FieldRequiredPredicate {
		const perms = this.getPermissionsForContext(createPredicateContext(this.normalizeScope(scopeOrIsRoot)))
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
		return this.getFieldPredicate(entity, Acl.Operation.read, fieldName, relationPath.length === 0 ? 'root' : 'through')
	}

	public createReadPredicate(
		entity: Model.Entity,
		fieldNames: readonly string[] | undefined,
		relationPath: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		return this.create(entity, Acl.Operation.read, fieldNames, createPredicateContextForEvaluatedRelationPath(relationPath))
	}

	public buildReadPredicates(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		relationPath: readonly Model.AnyRelationContext[],
	): Input.OptionalWhere {
		return this.buildPredicates(entity, predicates, createPredicateContextForEvaluatedRelationPath(relationPath))
	}

	public isEvaluatedPredicateReplacement(where: Input.OptionalWhere): boolean {
		return this.evaluatedPredicateReplacements.has(where)
	}

	public shouldApplyCellLevelPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.read,
		fieldName: string,
		scope?: PredicatePermissionScope,
	): boolean
	public shouldApplyCellLevelPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.read,
		fieldName: string,
		isRoot?: boolean,
	): boolean
	public shouldApplyCellLevelPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.read,
		fieldName: string,
		scopeOrIsRoot: PredicatePermissionScope | boolean = 'root',
	): boolean {
		const perms = this.getPermissionsForContext(createPredicateContext(this.normalizeScope(scopeOrIsRoot)))
		const rowLevelField = getRowLevelPredicatePseudoField(entity)
		const permissions = perms[entity.name]?.operations?.[operation]
		return permissions?.[fieldName] !== permissions?.[rowLevelField]
	}

	public createDeletePredicate(entity: Model.Entity, context?: PredicateContext): Input.OptionalWhere
	public createDeletePredicate(
		entity: Model.Entity,
		relationContext?: Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere
	public createDeletePredicate(
		entity: Model.Entity,
		contextOrRelation?: PredicateContext | Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere {
		const context = this.normalizeContext(contextOrRelation, isRoot)
		const neverCondition: Input.Where = { [entity.primary]: { never: true } }
		const entityPermissions = this.getPermissionsForContext(context)[entity.name]
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
		return this.buildPredicates(entity, [deletePredicate], context)
	}

	public create(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldNames?: readonly string[],
		context?: PredicateContext,
	): Input.OptionalWhere
	public create(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldNames?: readonly string[],
		relationContext?: Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere
	public create(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldNames: readonly string[] = [getRowLevelPredicatePseudoField(entity)],
		contextOrRelation?: PredicateContext | Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere {
		const context = this.normalizeContext(contextOrRelation, isRoot)
		const cacheKey = JSON.stringify([
			entity.name,
			operation,
			fieldNames,
			this.evaluatedRelationPathKey(context),
			this.permissionSetKey(context),
		])
		const cached = this.createCache.get(cacheKey)
		if (cached !== undefined) {
			return cached
		}
		const result = this.createInternal(entity, operation, fieldNames, context)
		this.createCache.set(cacheKey, result)
		return result
	}

	private createInternal(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldNames: readonly string[] = [getRowLevelPredicatePseudoField(entity)],
		context: PredicateContext = rootPredicateContext,
	): Input.OptionalWhere {
		const perms = this.getPermissionsForContext(context)
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

		return this.buildPredicates(entity, operationPredicates, context)
	}

	public buildPredicates(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		context?: PredicateContext,
	): Input.OptionalWhere
	public buildPredicates(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		relationContext?: Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere
	public buildPredicates(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		contextOrRelation?: PredicateContext | Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere {
		const context = this.normalizeContext(contextOrRelation, isRoot)
		const cacheKey = JSON.stringify([
			entity.name,
			predicates,
			this.evaluatedRelationPathKey(context),
			this.permissionSetKey(context),
		])
		const cached = this.buildCache.get(cacheKey)
		if (cached !== undefined) {
			return cached
		}
		const result = this.buildPredicatesInternal(entity, predicates, context)
		this.buildCache.set(cacheKey, result)
		return result
	}

	private buildPredicatesInternal(
		entity: Model.Entity,
		predicates: readonly Acl.PredicateReference[],
		context: PredicateContext = rootPredicateContext,
	): Input.OptionalWhere {
		const perms = this.getPermissionsForContext(context)
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
		return this.optimizePredicates(where, context)
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

	public optimizePredicates(where: Input.OptionalWhere, context?: PredicateContext): Input.OptionalWhere
	public optimizePredicates(
		where: Input.OptionalWhere,
		relationContext?: Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere
	public optimizePredicates(
		where: Input.OptionalWhere,
		contextOrRelation?: PredicateContext | Model.AnyRelationContext,
		isRoot?: boolean,
	): Input.OptionalWhere {
		const context = this.normalizeContext(contextOrRelation, isRoot)
		const relationPath = getEvaluatedRelationPath(context)
		const relationContext = relationPath?.[relationPath.length - 1]
		if (!relationContext || !relationContext.targetRelation) {
			return where
		}
		const sourcePredicate = this.create(
			relationContext.entity,
			Acl.Operation.read,
			[relationContext.relation.name],
			createPredicateContext(context.scope),
		)
		if (Object.keys(sourcePredicate).length === 0) {
			return where
		}

		const replacement: Input.OptionalWhere = { [relationContext.entity.primary]: { always: true } }
		this.evaluatedPredicateReplacements.add(replacement)
		return replaceEvaluatedPredicate(where, sourcePredicate, relationContext.targetRelation, replacement)
	}
}
