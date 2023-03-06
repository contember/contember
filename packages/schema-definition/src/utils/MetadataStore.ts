import 'reflect-metadata'

export interface MetadataStore<V> {
	get(target: Object): V
	update(target: Object, generator: (current: V) => V): void
}

export const createMetadataStore = <V>(initialValue: V): MetadataStore<V> => {
	const key = Symbol()
	const get = (target: Object): V => {
		return Reflect.hasMetadata(key, target)
			? Reflect.getMetadata(key, target)
			: initialValue
	}
	return {
		get,
		update: (target, generator) => {
			const current = get(target)
			const newMetadata = generator(current)
			Reflect.defineMetadata(key, newMetadata, target)
		},
	}
}
