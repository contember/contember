import { Acl, Input, Model } from 'cms-common'
import ObjectNode from '../content-api/graphQlResolver/ObjectNode'
import VariableInjector from './VariableInjector'
import { acceptFieldVisitor } from '../content-schema/modelUtils'
import FieldNode from '../content-api/graphQlResolver/FieldNode'

class PredicatesInjector {
	constructor(
		private readonly schema: Model.Schema,
		private readonly permissions: Acl.Permissions,
		private readonly variableInjector: VariableInjector
	) {}

	public inject(entity: Model.Entity, objectNode: ObjectNode<Input.ListQueryInput>, variables: Acl.VariablesMap) {
		const restrictedWhere = this.injectToWhere(objectNode.args.where || {}, entity, variables)
		const where = this.createWhere(entity, objectNode.fields.map(it => it.name), restrictedWhere, variables)
		const fields = this.injectToFields(objectNode, entity, variables)

		return new ObjectNode(objectNode.name, objectNode.alias, fields, { ...objectNode.args, where })
	}

	private injectToFields(
		objectNode: ObjectNode<Input.ListQueryInput>,
		entity: Model.Entity,
		variables: Acl.VariablesMap
	): (ObjectNode | FieldNode)[] {
		return objectNode.fields.map(field => {
			if (!(field instanceof ObjectNode)) {
				return field
			}

			const targetEntity = acceptFieldVisitor(this.schema, entity, field.name, {
				visitColumn: () => {
					throw new Error()
				},
				visitRelation: (_a, _b, targetEntity) => targetEntity
			})

			return this.inject(targetEntity, field, variables)
		})
	}

	private createWhere(
		entity: Model.Entity,
		fieldNames: string[],
		where: Input.Where,
		variables: Acl.VariablesMap
	): Input.Where {
		const entityPermissions: Acl.EntityPermissions = this.permissions[entity.name]
		const neverCondition: Input.Where = { [entity.primary]: { never: true } }

		if (!entityPermissions || !entityPermissions.operations.read) {
			return neverCondition
		}

		const predicates = this.getRequiredPredicates(fieldNames, entityPermissions.operations.read)
		if (predicates === false) {
			return neverCondition
		}

		const predicatesWhere: Input.Where[] = predicates.reduce(
			(result: Input.Where[], name: Acl.PredicateReference): Input.Where[] => {
				if (!entityPermissions.predicates[name]) {
					throw new Error(`${entity.name}: Undefined predicate ${name}`)
				}
				const predicateWhere: Input.Where = this.variableInjector.inject(entityPermissions.predicates[name], variables)
				return [...result, predicateWhere]
			},
			[]
		)

		return {
			and: [where, ...predicatesWhere].filter(it => Object.keys(it).length > 0)
		}
	}

	private getRequiredPredicates(
		fieldNames: string[],
		fieldPermissions: Acl.FieldPermissions
	): Acl.PredicateReference[] | false {
		const predicates: Acl.PredicateReference[] = []
		for (let name of fieldNames) {
			const fieldPredicate = fieldPermissions[name]
			if (!fieldPredicate) {
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

	private injectToWhere(where: Input.Where, entity: Model.Entity, variables: Acl.VariablesMap): Input.Where {
		const resultWhere: Input.Where = {}
		if (where.and) {
			resultWhere.and = where.and.map(it => this.injectToWhere(it, entity, variables))
		}
		if (where.or) {
			resultWhere.or = where.or.map(it => this.injectToWhere(it, entity, variables))
		}
		if (where.not) {
			resultWhere.not = this.injectToWhere(where.not, entity, variables)
		}
		const fields = Object.keys(where).filter(it => !['and', 'or', 'not'].includes(it))
		if (fields.length === 0) {
			return resultWhere
		}
		for (let field of fields) {
			const targetEntity = acceptFieldVisitor(this.schema, entity, field, {
				visitColumn: () => null,
				visitRelation: (_a, _b, targetEntity) => targetEntity
			})
			if (targetEntity) {
				resultWhere[field] = this.injectToWhere(where[field] as Input.Where, targetEntity, variables)
			} else {
				resultWhere[field] = where[field]
			}
		}
		return this.createWhere(entity, fields, resultWhere, variables)
	}
}

export default PredicatesInjector
