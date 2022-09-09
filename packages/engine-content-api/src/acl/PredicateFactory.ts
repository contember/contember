import { Acl, Input, Model } from '@contember/schema'
import { VariableInjector } from './VariableInjector'
import { EvaluatedPredicateReplacer } from './EvaluatedPredicateReplacer'

const getRowLevelPredicatePseudoField = (entity: Model.Entity) => entity.primary

export class PredicateFactory {
	constructor(
		private readonly permissions: Acl.Permissions,
		private readonly model: Model.Schema,
		private readonly variableInjector: VariableInjector,
	) {}

	public shouldApplyCellLevelPredicate(
		entity: Model.Entity,
		operation: Acl.Operation.read,
		fieldName: string,
	): boolean {
		const rowLevelField = getRowLevelPredicatePseudoField(entity)
		const permissions = this.permissions[entity.name]?.operations?.[operation]
		return permissions?.[fieldName] !== permissions?.[rowLevelField]
	}

	public create(
		entity: Model.Entity,
		operation: Acl.Operation.delete,
	): Input.Where
	public create(
		entity: Model.Entity,
		operation: Acl.Operation.update | Acl.Operation.read | Acl.Operation.create,
		fieldNames?: string[],
		relationContext?: Model.AnyRelationContext,
	): Input.Where
	public create(
		entity: Model.Entity,
		operation: Acl.Operation,
		fieldNames?: string[],
		relationContext?: Model.AnyRelationContext,
	): Input.Where {
		const entityPermissions: Acl.EntityPermissions = this.permissions[entity.name]
		const neverCondition: Input.Where = { [entity.primary]: { never: true } }

		if (!entityPermissions) {
			return neverCondition
		}

		let predicates: Acl.PredicateReference[]
		if (operation === Acl.Operation.delete) {
			const deletePredicate = entityPermissions.operations.delete
			if (deletePredicate === undefined || deletePredicate === false) {
				return neverCondition
			}
			if (deletePredicate === true) {
				return {}
			}
			predicates = [deletePredicate]
		} else {
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
			predicates = operationPredicates
		}

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
		return this.optimizePredicates(where, relationContext)
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

	private optimizePredicates(where: Input.Where, relationContext?: Model.AnyRelationContext) {
		if (!relationContext || !relationContext.targetRelation) {
			return where
		}
		const sourcePredicate = this.create(relationContext.entity, Acl.Operation.read, [relationContext.relation.name])
		if (Object.keys(sourcePredicate).length === 0) {
			return where
		}

		const replacer = new EvaluatedPredicateReplacer(sourcePredicate, relationContext.entity, relationContext.targetRelation)
		return replacer.replace(where)
	}
}
