export const toEnumClass = (classPrefix: string, name: string | undefined, namedDefault?: string) => {
	if (!name || name === 'default') {
		if (!namedDefault) {
			return
		}
		name = namedDefault
	}
	return `${classPrefix}${name}`
}
