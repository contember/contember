import { Acl, Input, Model } from '@contember/schema'
import { PredicateDefinitionProcessor } from '@contember/schema-utils'

export class VariableInjector {
	constructor(private readonly schema: Model.Schema, private readonly variables: Acl.VariablesMap) {}

	public inject(entity: Model.Entity, where: Acl.PredicateDefinition): Input.Where {
		const predicateDefinitionProcessor = new PredicateDefinitionProcessor(this.schema)

		return predicateDefinitionProcessor.process(entity, where, {
			handleColumn: ({ value }) => {
				if (typeof value === 'string') {
					return this.createCondition(this.variables[value] || undefined)
				}
				return value as Input.Condition
			},
			handleRelation: ({ value, targetEntity }) => {
				if (typeof value === 'string') {
					return { [targetEntity.primary]: this.createCondition(this.variables[value] || undefined) }
				}
				return value
			},
		})
	}

	private createCondition(variable: Acl.VariableValue | undefined): Input.Condition {
		if (variable === undefined) {
			return { never: true }
		}
		if (Array.isArray(variable)) {
			return { in: variable }
		}
		if (typeof variable === 'string' || typeof variable === 'number') {
			return { eq: variable }
		}
		throw new Error('not implemented')
	}
}
