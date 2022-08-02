export const optimizeOr = <P extends { or?: readonly P[] }>(parts: readonly (P | boolean)[]): P | { or?: P[] } | boolean => {
	const resultParts: P[] = []

	for (const part of parts) {
		if (part === true) {
			return true
		} else if (part !== false) {
			resultParts.push(...Array.isArray(part.or) ? part.or : [part])
		}
	}

	if (resultParts.length > 1) {
		return { or: resultParts }
	} else if (resultParts.length === 1) {
		return resultParts[0]
	} else {
		return {}
	}
}

export const optimizeAnd = <P extends { and: readonly P[] } | { [key: string]: unknown }>(parts: readonly (P | boolean | undefined)[]): P | { and?: P[] } | boolean => {
	const resultParts: P[] = []
	let hasAlways = false

	for (const part of parts) {
		if (part === true) {
			hasAlways = true
		} else if (part === false) {
			return false
		} else if (part !== undefined) {
			resultParts.push(...Array.isArray(part.and) ? part.and : [part])
		}
	}

	if (resultParts.length > 1) {
		return { and: resultParts }
	} else if (resultParts.length === 1) {
		return resultParts[0]
	} else if (hasAlways) {
		return true
	} else {
		return {}
	}
}

export const optimizeNot = <P extends object>(part: P | boolean): { not: P } | boolean => {
	return typeof part === 'boolean' ? !part : { not: part }
}
