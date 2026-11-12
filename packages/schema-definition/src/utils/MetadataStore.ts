export interface MetadataStore<V> {
	get(target: Object): V
	update(target: Object, generator: (current: V) => V, context?: ClassDecoratorContext): void
}

const getTC39ClassMetadata = (target: Object, key: symbol): unknown => {
	const metaSymbol: symbol | undefined = Symbol.metadata
		?? Reflect.ownKeys(target).find((k): k is symbol => typeof k === 'symbol' && String(k) === 'Symbol(Symbol.metadata)')
	if (!metaSymbol) return undefined
	return (target as any)[metaSymbol]?.[key]
}

/**
 * Metadata attached to legacy-decorated classes and their members. Like `Reflect.getMetadata`,
 * a lookup walks the prototype chain, so a subclass sees its parent's value until it defines its own.
 */
export interface LegacyMetadataRegistry<V> {
	define(target: object, value: V, propertyKey?: string | symbol): void
	find(target: object, propertyKey?: string | symbol): { value: V } | undefined
}

export const createLegacyMetadataRegistry = <V>(): LegacyMetadataRegistry<V> => {
	const classLevel = Symbol('class')
	const entries = new WeakMap<object, Map<string | symbol, { value: V }>>()
	return {
		define: (target, value, propertyKey = classLevel) => {
			let members = entries.get(target)
			if (!members) {
				members = new Map()
				entries.set(target, members)
			}
			members.set(propertyKey, { value })
		},
		find: (target, propertyKey = classLevel) => {
			for (let current: object | null = target; current !== null; current = Object.getPrototypeOf(current)) {
				const entry = entries.get(current)?.get(propertyKey)
				if (entry) {
					return entry
				}
			}
			return undefined
		},
	}
}

export const createMetadataStore = <V>(initialValue: V): MetadataStore<V> => {
	const key = Symbol()
	const legacy = createLegacyMetadataRegistry<V>()
	const get = (target: Object): V => {
		const tc39 = getTC39ClassMetadata(target, key)
		if (tc39 !== undefined) return tc39 as V
		const legacyEntry = legacy.find(target)
		return legacyEntry ? legacyEntry.value : initialValue
	}
	return {
		get,
		update: (target, generator, context?) => {
			const current = get(target)
			const newMetadata = generator(current)
			legacy.define(target, newMetadata)
			if (context) {
				context.metadata[key] = newMetadata
			}
		},
	}
}
