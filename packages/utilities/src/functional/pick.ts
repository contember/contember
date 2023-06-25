export function pick<T extends Object, K extends keyof T>(object: T, properties: ReadonlyArray<K>): Pick<T, K> {
	const next: Partial<Pick<T, K>> = {}

	for (let key of properties) {
		if (key in object) {
			next[key] = object[key]
		} else {
			throw new Error(`Key "${String(key)}" does not exist in object ${JSON.stringify(object)}`)
		}
	}

	return next as Pick<T, K>
}
