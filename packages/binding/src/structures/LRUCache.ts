// This is heavily inspired by https://stackoverflow.com/a/46432113
export class LRUCache<Key, Value> {
	private readonly cache = new Map<Key, Value>()

	public constructor(private readonly maxSize: number) {}

	public get(key: Key): Value | undefined {
		const value = this.cache.get(key)

		if (value !== undefined) {
			this.cache.delete(key)
			this.cache.set(key, value)
		}
		return value
	}

	public set(key: Key, value: Value) {
		if (this.cache.has(key)) {
			this.cache.delete(key) // Refresh this key
		} else if (this.cache.size === this.maxSize) {
			this.cache.delete(this.getOldestKey()) // Evict the oldest value
		}
		this.cache.set(key, value)
	}

	private getOldestKey(): Key {
		return this.cache.keys().next().value
	}
}
