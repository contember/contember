export const getFilterName = <T>(name: string | undefined, field: string | T): string => {
	const resolvedName = name ?? field
	if (typeof resolvedName === 'string') {
		return resolvedName
	}
	throw new Error('Please provide a name for the filter')
}
