export default function deepCopy<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map(deepCopy) as any as T
	} else if (value === null) {
		return value
	} else if (typeof value === 'object') {
		return Object.keys(value)
			.map(k => ({ [k]: deepCopy((value as any)[k]) }))
			.reduce((a, c) => Object.assign(a, c), {}) as T
	} else {
		return value
	}
}
