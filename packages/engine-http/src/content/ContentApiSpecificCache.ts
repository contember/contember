import { clearTimeout } from 'node:timers'

type Entry<V> = {
	timer?: ReturnType<typeof setTimeout>
	value: V
}

export class ContentApiSpecificCache<ObjectKey extends object, Value> {
	private cache = new WeakMap<ObjectKey, Map<string, Entry<Value>>>()

	constructor(
		private options: {
			ttlSeconds?: number
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

		let timer: ReturnType<typeof setTimeout> | undefined = undefined
		if (this.options.ttlSeconds) {
			// wrap to WeakRef so the Map can be garbage-collected, when ObjectKey is garbage collected
			const cacheMapRef = new WeakRef(cacheMap)
			timer = setTimeout(() => {
				cacheMapRef.deref()?.delete(scalarKey)
			}, this.options.ttlSeconds * 1000)
		}

		if (cacheValue) {
			clearTimeout(cacheValue.timer)
			cacheValue.timer = timer
			return cacheValue.value
		}

		const value = createValue()
		cacheMap.set(scalarKey, {
			timer,
			value,
		})

		return value
	}
}
