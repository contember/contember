import { Acl, Input, Model } from '@contember/schema'
import { PredicateDefinitionProcessor } from '@contember/schema-utils'

export default class PredicateReference {
	constructor(public readonly name: Acl.PredicateReference) {}
}

export const resolvePredicateReference = (
	model: Model.Schema,
	permissions: Acl.Permissions,
	entity: Model.Entity,
	predicate: Acl.PredicateDefinition<PredicateReference>,
): Acl.PredicateDefinition => {
	const predicateDefinitionProcessor = new PredicateDefinitionProcessor(model)
	return predicateDefinitionProcessor.process<Acl.PredicateVariable | Input.Condition, PredicateReference>(
		entity,
		predicate,
		{
			handleColumn: ({ value }) => {
				if (value instanceof PredicateReference) {
					throw new Error()
				}
				return value
			},
			handleRelation: ({ value, targetEntity }) => {
				if (value instanceof PredicateReference) {
					if (!permissions[targetEntity.name]) {
						throw new Error(
							`Permissions for entity ${targetEntity.name} not found. Make sure you are defining it in a right order.`,
						)
					}
					const predicate = permissions[targetEntity.name].predicates[value.name]
					if (!predicate) {
						throw new Error(
							`Predicate ${value.name} of entity ${targetEntity.name} not found. Make sure you are defining it in a right order.`,
						)
					}
					return predicate
				}
				return value
			},
		},
	)
}
