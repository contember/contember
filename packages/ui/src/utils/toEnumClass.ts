export const toEnumClass = (classPrefix: string, name: string | undefined) =>
	name && name !== 'default' ? `${classPrefix}${name}` : undefined
