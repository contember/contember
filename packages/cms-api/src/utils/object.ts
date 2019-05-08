type TypeGuard<V = any, R extends V = V> = (key: string, value: V, object: { [key: string]: V }) => value is R
type Filter<V = any> = (key: string, value: V, object: { [key: string]: V }) => boolean

function filterObject<V = any, R extends V = V>(
	object: { [key in string]: V },
	callback: TypeGuard<V, R> | Filter<V>
): { [key: string]: R } {
	return Object.entries(object)
		.filter<[string, R]>((it): it is [string, R] => callback(it[0], it[1] as V, object))
		.reduce((result, [key, value]) => ({ ...(result as any), [key]: value }), {})
}

export { filterObject }
