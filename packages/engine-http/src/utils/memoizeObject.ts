
export const createMemoizer = <T extends object>(canonicalizeValue: (value: T) => string) => {
	const cache = new Map<string, WeakRef<T>>()
	const canonicalValueCache = new WeakMap<T, string>()

	const finalizer = new FinalizationRegistry<string>(key => {
		cache.delete(key)
	})

	return (value: T): T => {
		if (typeof value !== 'object' || value === null) {
			throw new TypeError('Value must be a non-null object')
		}
		let key = canonicalValueCache.get(value)
		if (!key) {
			key = canonicalizeValue(value)
			canonicalValueCache.set(value, key)
		}

		const entry = cache.get(key)
		if (entry) {
			const obj = entry.deref()
			if (obj !== undefined) {
				return obj as T
			}
		}

		const stableObj = value
		const weakRef = new WeakRef(stableObj)

		finalizer.register(stableObj, key)

		cache.set(key, weakRef)

		return stableObj
	}

}
