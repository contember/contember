import 'reflect-metadata'

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

export const createMetadataStore = <V>(initialValue: V): MetadataStore<V> => {
	const key = Symbol()
	const get = (target: Object): V => {
		const tc39 = getTC39ClassMetadata(target, key)
		if (tc39 !== undefined) return tc39 as V
		return typeof Reflect.hasMetadata === 'function' && Reflect.hasMetadata(key, target)
			? Reflect.getMetadata(key, target)
			: initialValue
	}
	return {
		get,
		update: (target, generator, context?) => {
			const current = get(target)
			const newMetadata = generator(current)
			if (typeof Reflect.defineMetadata === 'function') {
				Reflect.defineMetadata(key, newMetadata, target)
			}
			if (context) {
				context.metadata[key] = newMetadata
			}
		},
	}
}
