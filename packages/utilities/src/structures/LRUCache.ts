// This is heavily inspired by https://stackoverflow.com/a/46432113
export interface LRUCacheOptions {
	/** Milliseconds after `set` when an entry stops being returned. Reading an entry does not extend it. */
	ttl?: number
	now?: () => number
}

export class LRUCache<Key, Value> {
	private readonly cache = new Map<Key, { value: Value; expiresAt: number }>()
	private readonly ttl: number
	private readonly now: () => number

	public constructor(private readonly maxSize: number, options: LRUCacheOptions = {}) {
		this.ttl = options.ttl ?? Infinity
		this.now = options.now ?? Date.now
	}

	public get(key: Key): Value | undefined {
		const entry = this.cache.get(key)
		if (entry === undefined) {
			return undefined
		}
		this.cache.delete(key)
		if (entry.expiresAt < this.now()) {
			return undefined
		}
		this.cache.set(key, entry)
		return entry.value
	}

	public set(key: Key, value: Value) {
		if (this.cache.has(key)) {
			this.cache.delete(key) // Refresh this key
		} else if (this.cache.size >= this.maxSize) {
			this.cache.delete(this.getOldestKey()) // Evict the oldest value
		}
		this.cache.set(key, { value, expiresAt: this.now() + this.ttl })
	}

	/** Removes expired entries; `get` never returns them, this only frees their memory. */
	public purgeStale() {
		const now = this.now()
		for (const [key, entry] of this.cache) {
			if (entry.expiresAt < now) {
				this.cache.delete(key)
			}
		}
	}

	private getOldestKey(): Key {
		return this.cache.keys().next().value!
	}
}
