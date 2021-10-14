export class PromiseMap<K, V> {
	private readonly values = new Map<K, Promise<V>>()

	async fetch(key: K, generator: (key: K) => Promise<V>): Promise<V> {
		do {
			const value = this.values.get(key)
			if (value === undefined) {
				break
			}
			try {
				return await value
			} catch {}
		} while (true)

		const newValue = generator(key) // intentionally not awaiting
		this.values.set(key, newValue)
		try {
			return await newValue
		} catch (e) {
			this.values.delete(key)
			throw e
		}
	}
}
