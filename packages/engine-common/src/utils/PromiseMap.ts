export class PromiseMap<K, V> extends Map<K, Promise<V>>{
	async fetch(key: K, generator: (key: K) => Promise<V>): Promise<V> {
		const value = this.get(key)
		if (value !== undefined) {
			return await value
		}
		const newValue = generator(key) // intentionally not awaiting
		this.set(key, newValue)
		try {
			return await newValue
		} catch (e) {
			this.delete(key)
			throw e
		}
	}
}
