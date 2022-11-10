export const mapGetOrPut = <K, V, D extends V>(
	map: Map<K, V>,
	key: K,
	defaultValue: () => D,
): V => {
	const value = map.get(key)
	if (value !== undefined) {
		return value
	}
	const newValue = defaultValue()
	map.set(key, newValue)
	return newValue
}
