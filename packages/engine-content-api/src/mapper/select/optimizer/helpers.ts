export const optimizeOr = <P>(parts: readonly (P | boolean)[]): P | boolean => {
	const resultParts: P[] = []

	for (const part of parts) {
		if (part === true) {
			return true
		} else if (part !== false) {
			resultParts.push(part)
		}
	}

	if (resultParts.length === 1) {
		return resultParts[0]
	} else if (resultParts.length > 0) {
		return { or: resultParts } as unknown as P
	} else {
		return {} as unknown as P
	}
}

export const optimizeAnd = <P>(parts: readonly (P | boolean | undefined)[]): P | boolean => {
	const resultParts: P[] = []
	let hasAlways = false

	for (const part of parts) {
		if (part === true) {
			hasAlways = true
		} else if (part === false) {
			return false
		} else if (part !== undefined) {
			resultParts.push(part)
		}
	}

	if (resultParts.length === 1) {
		return resultParts[0]
	} else if (resultParts.length > 0) {
		return { and: resultParts } as unknown as P
	} else if (hasAlways) {
		return true
	} else {
		return {} as unknown as P
	}
}
