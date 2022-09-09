import { Acl, Input, Model, Writable } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { PredicateFactory } from './PredicateFactory'

export class PredicatesInjector {
	constructor(private readonly schema: Model.Schema, private readonly predicateFactory: PredicateFactory) {}

	public inject(entity: Model.Entity, where: Input.OptionalWhere, relationContext?: Model.AnyRelationContext): Input.OptionalWhere {
		const restrictedWhere = this.injectToWhere(where, entity, true)
		return this.createWhere(entity, undefined, restrictedWhere, relationContext)
	}

	private createWhere(
		entity: Model.Entity,
		fieldNames: string[] | undefined,
		where: Input.OptionalWhere,
		relationContext?: Model.AnyRelationContext,
	): Input.OptionalWhere {
		const predicatesWhere: Input.Where = this.predicateFactory.create(entity, Acl.Operation.read, fieldNames, relationContext)

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
		relationContext?: Model.AnyRelationContext,
	): Input.OptionalWhere {
		const resultWhere: Writable<Input.OptionalWhere> = {}
		if (where.and) {
			resultWhere.and = where.and.filter((it): it is Input.Where => !!it).map(it => this.injectToWhere(it, entity, isRoot, relationContext))
		}
		if (where.or) {
			resultWhere.or = where.or.filter((it): it is Input.Where => !!it).map(it => this.injectToWhere(it, entity, isRoot, relationContext))
		}
		if (where.not) {
			resultWhere.not = this.injectToWhere(where.not, entity, isRoot, relationContext)
		}

		const fields = Object.keys(where).filter(it => !['and', 'or', 'not'].includes(it))

		if (fields.length === 0) {
			return resultWhere
		}
		for (let field of fields) {
			resultWhere[field] = acceptFieldVisitor(this.schema, entity, field, {
				visitColumn: () => where[field],
				visitRelation: context => this.injectToWhere(where[field] as Input.Where, context.targetEntity, false, context),
			})
		}
		const fieldsForPredicate = !isRoot
			? fields
			: fields.filter(it => this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, it))

		return this.createWhere(entity, fieldsForPredicate, resultWhere, relationContext)
	}

}
