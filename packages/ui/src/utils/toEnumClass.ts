export const toEnumClass = (classPrefix: string, name: string | undefined, namedDefault?: string) => {
	if (name === undefined || name === 'default') {
		if (namedDefault === undefined) {
			return
		}
		name = namedDefault
	}
	return `${classPrefix}${name}`
}
