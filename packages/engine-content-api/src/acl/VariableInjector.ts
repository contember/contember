import { Acl, Input, Model } from '@contember/schema'
import { PredicateDefinitionProcessor } from '@contember/schema-utils'

export class VariableInjector {
	constructor(private readonly schema: Model.Schema, private readonly variables: Acl.VariablesMap) {}

	public inject(entity: Model.Entity, where: Acl.PredicateDefinition): Input.Where {
		const predicateDefinitionProcessor = new PredicateDefinitionProcessor(this.schema)

		return predicateDefinitionProcessor.process(entity, where, {
			handleColumn: ({ value }) => {
				if (typeof value === 'string') {
					return this.variables[value] ?? { never: true }
				}
				return value as Input.Condition
			},
			handleRelation: ({ value, targetEntity }) => {
				if (typeof value === 'string') {
					return { [targetEntity.primary]: this.variables[value] ?? { never: true } }
				}
				return value
			},
		})
	}
}
