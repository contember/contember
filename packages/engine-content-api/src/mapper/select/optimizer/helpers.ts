export const optimizeJunction = <P>(type: 'and' | 'or', parts: readonly (P | boolean)[]): P | boolean => {
	if (type === 'and') {
		return optimizeAnd(parts)
	} else {
		return optimizeOr(parts)
	}
}

export const optimizeOr = <P>(parts: readonly (P | boolean)[]): P | boolean => {
	const resultParts: P[] = []

	for (const part of parts) {
		if (part === true) {
			return true
		} else if (part !== false) {
			resultParts.push(part)
		}
	}
	if (resultParts.length === 0) {
		return {} as unknown as P
	}

	return resultParts.length === 1 ? resultParts[0] : { or: resultParts } as unknown as P
}

export const optimizeAnd = <P>(parts: readonly (P | boolean | undefined)[]): P | boolean => {
	const resultParts: P[] = []
	let hasAlways = false

	for (const part of parts) {
		if (part === undefined) {
			// do nothing
		} else if (part === true) {
			hasAlways = true
		} else if (part === false) {
			return false
		} else {
			resultParts.push(part)
		}
	}

	if (resultParts.length === 0) {
		return hasAlways ? true : {} as unknown as P
	}

	return resultParts.length === 1 ? resultParts[0] : { and: resultParts } as unknown as P
}
