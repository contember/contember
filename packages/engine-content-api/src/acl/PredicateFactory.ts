import { Acl, Input, Model } from '@contember/schema'
import { VariableInjector } from './VariableInjector'
import { EvaluatedPredicateReplacer } from './EvaluatedPredicateReplacer'

const getRowLevelPredicatePseudoField = (entity: Model.Entity) => entity.primary

export interface FieldRequiredPredicate {
	predicate: Acl.Predicate
	isSameAsPrimary: boolean
}

export class PredicateFactory {
	constructor(
		private readonly permissions: Acl.Permissions,
		private readonly model: Model.Schema,
		private readonly variableInjector: VariableInjector,
		private readonly allPermissions?: Acl.Permissions,
	) {}

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

	/** Delete predicates are not context-aware — through-permission support is scoped to read operations only. */
	public createDeletePredicate(entity: Model.Entity) {
		const neverCondition: Input.Where = { [entity.primary]: { never: true } }
		const entityPermissions = this.permissions[entity.name]
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
		return this.buildPredicates(entity, [deletePredicate])
	}

	public create(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldNames: string[] = [getRowLevelPredicatePseudoField(entity)],
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
		predicates: Acl.PredicateReference[],
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
		fieldNames: string[],
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

		const replacer = new EvaluatedPredicateReplacer(sourcePredicate, relationContext.entity, relationContext.targetRelation)
		return replacer.replace(where)
	}
}
