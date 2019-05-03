function filterObject<V = any, R extends V = V>(
	object: { [key in string]: V },
	callback:
		| ((key: string, value: V, object: { [key: string]: V }) => value is R)
		| (((key: string, value: V, object: { [key: string]: V }) => boolean))
): { [key: string]: R } {
	return Object.entries(object)
		.filter<[string, R]>((it): it is [string, R] => callback(it[0], it[1] as V, object))
		.reduce((result, [key, value]) => ({ ...(result as any), [key]: value }), {})
}

export { filterObject }
