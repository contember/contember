import { Acl, Input, Model, Writable } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { PredicateFactory } from './PredicateFactory'

export class PredicatesInjector {
	constructor(private readonly schema: Model.Schema, private readonly predicateFactory: PredicateFactory) {}

	public inject(entity: Model.Entity, where: Input.OptionalWhere, overRelation?: Model.AnyRelation): Input.OptionalWhere {
		const restrictedWhere = this.injectToWhere(where, entity, true)
		return this.createWhere(entity, undefined, restrictedWhere, overRelation)
	}

	private createWhere(
		entity: Model.Entity,
		fieldNames: string[] | undefined,
		where: Input.OptionalWhere,
		overRelation?: Model.AnyRelation,
	): Input.OptionalWhere {
		const predicatesWhere: Input.Where = this.predicateFactory.create(entity, Acl.Operation.read, fieldNames, overRelation)

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
		overRelation?: Model.AnyRelation,
	): Input.OptionalWhere {
		const resultWhere: Writable<Input.OptionalWhere> = {}
		if (where.and) {
			resultWhere.and = where.and.filter((it): it is Input.Where => !!it).map(it => this.injectToWhere(it, entity, isRoot, overRelation))
		}
		if (where.or) {
			resultWhere.or = where.or.filter((it): it is Input.Where => !!it).map(it => this.injectToWhere(it, entity, isRoot, overRelation))
		}
		if (where.not) {
			resultWhere.not = this.injectToWhere(where.not, entity, isRoot, overRelation)
		}

		const fields = Object.keys(where).filter(it => !['and', 'or', 'not'].includes(it))

		if (fields.length === 0) {
			return resultWhere
		}
		for (let field of fields) {
			const [targetEntity, targetRelation] = acceptFieldVisitor(this.schema, entity, field, {
				visitColumn: () => null,
				visitRelation: ({ targetEntity, targetRelation }) => [targetEntity, targetRelation ?? undefined],
			}) ?? []
			if (targetEntity) {
				resultWhere[field] = this.injectToWhere(where[field] as Input.Where, targetEntity, false, targetRelation)
			} else {
				resultWhere[field] = where[field]
			}
		}
		const fieldsForPredicate = !isRoot
			? fields
			: fields.filter(it => this.predicateFactory.shouldApplyCellLevelPredicate(entity, Acl.Operation.read, it))

		return this.createWhere(entity, fieldsForPredicate, resultWhere, overRelation)
	}

}
