export const resolveAllAcceptedMimes = (inputMimes: (Record<string, string[]> | undefined)[]): Record<string, string[]> | undefined => {

	// new implementation
	const result: Record<string, string[]> = {}
	for (const mimes of inputMimes) {
		if (mimes === undefined) {
			return undefined
		}
		for (const [key, value] of Object.entries(mimes)) {
			if (value === null || value.includes('*') || value.includes('*/*')) {
				return undefined
			}
			result[key] ??= []
			result[key].push(...value)
		}
	}
	return result
}
