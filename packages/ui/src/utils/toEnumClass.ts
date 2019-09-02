export const toEnumClass = <N extends string>(classPrefix: string, name: N | undefined, namedDefault?: N) => {
	if (name === undefined || name === 'default') {
		if (namedDefault === undefined) {
			return
		}
		name = namedDefault
	}
	return `${classPrefix}${name}`
}
