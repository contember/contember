import { clearTimeout } from 'node:timers'

type RecencyToken<V> = {
	// weak, so the recency order keeps neither the Map nor its ObjectKey alive
	cacheMapRef: WeakRef<Map<string, Entry<V>>>
	scalarKey: string
}

type Entry<V> = {
	timer?: ReturnType<typeof setTimeout>
	value: V
	recency: RecencyToken<V>
}

export class ContentApiSpecificCache<ObjectKey extends object, Value> {
	private cache = new WeakMap<ObjectKey, Map<string, Entry<Value>>>()

	// Least recently used first, tracked only with maxEntries: nothing else removes a token whose Map was garbage-collected.
	// With maxEntries, such a token stays counted until it is evicted as the oldest.
	private recency = new Set<RecencyToken<Value>>()

	constructor(
		private options: {
			ttlSeconds?: number
			maxEntries?: number
		},
	) {
	}

	public fetch(objectKey: ObjectKey, scalarKey: string, createValue: () => Value): Value {
		let cacheMap = this.cache.get(objectKey)

		if (!cacheMap) {
			cacheMap = new Map()
			this.cache.set(objectKey, cacheMap)
		}

		const cacheValue = cacheMap.get(scalarKey)
		if (cacheValue) {
			this.markUsed(cacheValue)
			return cacheValue.value
		}

		const entry: Entry<Value> = {
			value: createValue(),
			recency: { cacheMapRef: new WeakRef(cacheMap), scalarKey },
		}
		cacheMap.set(scalarKey, entry)
		this.markUsed(entry)
		this.evictOverLimit()

		return entry.value
	}

	private markUsed(entry: Entry<Value>): void {
		clearTimeout(entry.timer)
		if (this.options.ttlSeconds) {
			const token = entry.recency
			entry.timer = setTimeout(() => this.remove(token), this.options.ttlSeconds * 1000)
		}
		if (this.options.maxEntries) {
			this.recency.delete(entry.recency)
			this.recency.add(entry.recency)
		}
	}

	private evictOverLimit(): void {
		const maxEntries = this.options.maxEntries
		if (!maxEntries) {
			return
		}
		for (const token of this.recency) {
			if (this.recency.size <= maxEntries) {
				return
			}
			this.remove(token)
		}
	}

	private remove(token: RecencyToken<Value>): void {
		this.recency.delete(token)
		const cacheMap = token.cacheMapRef.deref()
		const entry = cacheMap?.get(token.scalarKey)
		if (!cacheMap || entry?.recency !== token) {
			return
		}
		clearTimeout(entry.timer)
		cacheMap.delete(token.scalarKey)
	}
}
