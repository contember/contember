import { acceptFieldVisitor } from '../'
import { Acl, Input, Model } from '@contember/schema'

class PredicateDefinitionProcessor {
	constructor(private readonly schema: Model.Schema) {}

	public process<WhereValue, PredicateExtension = never>(
		entity: Model.Entity,
		definition: Acl.PredicateDefinition<PredicateExtension>,
		handler: PredicateDefinitionProcessor.Handler<WhereValue, PredicateExtension>,
	): Input.Where<WhereValue> {
		return Object.entries(definition).reduce((result, [key, value]) => {
			if (value === undefined) {
				return result
			}
			if (key === 'not') {
				return { ...result, not: this.process(entity, value as Acl.PredicateDefinition<PredicateExtension>, handler) }
			} else if (key === 'and' || key === 'or') {
				return { ...result, [key]: (value as Acl.PredicateDefinition[]).map(it => this.process(entity, it, handler)) }
			}
			const fieldWhere = acceptFieldVisitor<WhereValue | Input.Where>(this.schema, entity, key, {
				visitColumn: (entity, column) => {
					return handler.handleColumn({ entity, column, value: value as Input.Condition | PredicateExtension })
				},
				visitRelation: (entity, relation, targetEntity) => {
					return handler.handleRelation({
						relation,
						entity,
						targetEntity,
						value: value as Input.Condition | PredicateExtension,
					})
				},
			})
			return { ...result, [key]: fieldWhere }
		}, {})
	}
}

namespace PredicateDefinitionProcessor {
	export interface Handler<R, T> {
		handleColumn(ctx: {
			value: T | Acl.PredicateVariable | Input.Condition
			entity: Model.Entity
			column: Model.AnyColumn
		}): R | Input.Where

		handleRelation(ctx: {
			value: T | Acl.PredicateVariable | Input.Condition
			entity: Model.Entity
			relation: Model.Relation
			targetEntity: Model.Entity
		}): R | Input.Where
	}
}

export { PredicateDefinitionProcessor }
