import { Acl, Input, Model } from '@contember/schema'
import { OldNewPredicateExtractor, PredicateDefinitionProcessor } from '@contember/schema-utils'

export class VariableInjector {
	private injectorCache = new Map<Acl.PredicateState | 'merged', WeakMap<Acl.PredicateDefinition, Input.Where>>()
	private extractor = new OldNewPredicateExtractor()

	constructor(private readonly schema: Model.Schema, private readonly variables: Acl.VariablesMap) {}

	/**
	 * @param state when set to 'old'/'new', `_old`/`_new` markers in the predicate are resolved for
	 *   that state of the row being updated; when omitted both markers are merged (single-state
	 *   operations: read/create/delete).
	 */
	public inject(entity: Model.Entity, where: Acl.PredicateDefinition, state?: Acl.PredicateState): Input.Where {
		const cacheKey = state ?? 'merged'
		let cache = this.injectorCache.get(cacheKey)
		if (!cache) {
			cache = new WeakMap()
			this.injectorCache.set(cacheKey, cache)
		}
		const cacheEntry = cache.get(where)
		if (cacheEntry !== undefined) {
			return cacheEntry
		}
		const extracted = state !== undefined ? this.extractor.extract(where, state) : this.extractor.extractMerged(where)
		const predicateDefinitionProcessor = new PredicateDefinitionProcessor(this.schema)

		const resultWhere = predicateDefinitionProcessor.process(entity, extracted, {
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
		cache.set(where, resultWhere)
		return resultWhere
	}
}
