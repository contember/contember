import { Acl, Input, Model } from '@contember/schema'
import { PredicateDefinitionProcessor } from '@contember/schema-utils'

export class VariableInjector {
	private injectorCache = new WeakMap<Acl.PredicateDefinition, Map<string, Input.Where>>()

	constructor(private readonly schema: Model.Schema, private readonly variables: Acl.VariablesMap) {}

	public inject(entity: Model.Entity, where: Acl.PredicateDefinition): Input.Where {
		const entityCache = this.injectorCache.get(where)
		const cacheEntry = entityCache?.get(entity.name)
		if (cacheEntry !== undefined) {
			return cacheEntry
		}
		const predicateDefinitionProcessor = new PredicateDefinitionProcessor(this.schema)

		const resultWhere = predicateDefinitionProcessor.process(entity, where, {
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
		if (entityCache) {
			entityCache.set(entity.name, resultWhere)
		} else {
			this.injectorCache.set(where, new Map([[entity.name, resultWhere]]))
		}
		return resultWhere
	}
}
