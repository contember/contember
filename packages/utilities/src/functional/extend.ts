/** @internal */
export function extend<B, E>(
	base: B,
	extension: E,
) {
	base = Object.freeze(base)
	extension = Object.freeze(extension)

	if (typeof base !== typeof extension) {
		return extension === undefined ? base : extension
	} else {
		if (typeof base === 'object' && typeof extension === 'object') {
			if (Array.isArray(base) && Array.isArray(extension)) {
				return Object.freeze([...base, ...extension])
			} else if (base && extension) {
				if ('$$typeof' in extension) {
					return extension
				}

				const keys = [...new Set([
					...Object.keys(base),
					...Object.keys(extension),
				])]

				const entries: [string, unknown][] = keys.map(
					key => [key, extend((base as Record<string, unknown>)[key], (extension as Record<string, unknown>)[key])],
				)

				return Object.freeze(Object.fromEntries(entries))
			} else {
				return extension
			}
		} else {
			return extension
		}
	}
}
