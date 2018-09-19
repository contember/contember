import { Acl, Input, Model } from 'cms-common'
import ObjectNode from '../content-api/graphQlResolver/ObjectNode'
import { acceptFieldVisitor } from '../content-schema/modelUtils'
import PredicateFactory from './PredicateFactory'

class PredicatesInjector {
	constructor(private readonly schema: Model.Schema, private readonly predicateFactory: PredicateFactory) {}

	public inject(entity: Model.Entity, objectNode: ObjectNode<Input.ListQueryInput>) {
		const restrictedWhere = this.injectToWhere(objectNode.args.where || {}, entity)
		const where = this.createWhere(entity, [entity.primary], restrictedWhere)

		return new ObjectNode(objectNode.name, objectNode.alias, objectNode.fields, { ...objectNode.args, where })
	}

	private createWhere(entity: Model.Entity, fieldNames: string[], where: Input.Where): Input.Where {
		const predicatesWhere: Input.Where = this.predicateFactory.create(entity, Acl.Operation.read, fieldNames)

		return { and: [where, predicatesWhere].filter(it => Object.keys(it).length > 0) }
	}

	private injectToWhere(where: Input.Where, entity: Model.Entity): Input.Where {
		const resultWhere: Input.Where = {}
		if (where.and) {
			resultWhere.and = where.and.map(it => this.injectToWhere(it, entity))
		}
		if (where.or) {
			resultWhere.or = where.or.map(it => this.injectToWhere(it, entity))
		}
		if (where.not) {
			resultWhere.not = this.injectToWhere(where.not, entity)
		}
		const fields = Object.keys(where).filter(it => !['and', 'or', 'not'].includes(it))
		if (fields.length === 0) {
			return resultWhere
		}
		for (let field of fields) {
			const targetEntity = acceptFieldVisitor(this.schema, entity, field, {
				visitColumn: () => null,
				visitRelation: (_a, _b, targetEntity) => targetEntity,
			})
			if (targetEntity) {
				resultWhere[field] = this.injectToWhere(where[field] as Input.Where, targetEntity)
			} else {
				resultWhere[field] = where[field]
			}
		}
		return this.createWhere(entity, fields, resultWhere)
	}
}

export default PredicatesInjector
