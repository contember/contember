export const optimizeOr = <P extends { or?: readonly P[] }>(operands: readonly (P | boolean)[]): P | { or?: P[] } | boolean => {
	const normalized: P[] = []

	for (const operand of operands) {
		if (operand === true) {
			return true
		} else if (operand !== false) {
			normalized.push(...Array.isArray(operand.or) ? operand.or : [operand])
		}
	}

	if (normalized.length > 1) {
		return { or: normalized }
	} else if (normalized.length === 1) {
		return normalized[0]
	} else {
		return {}
	}
}

export const optimizeAnd = <P extends { and: readonly P[] } | { [key: string]: unknown }>(operands: readonly (P | boolean | undefined)[]): P | { and?: P[] } | boolean => {
	const normalized: P[] = []
	let hasAlways = false

	for (const operand of operands) {
		if (operand === true) {
			hasAlways = true
		} else if (operand === false) {
			return false
		} else if (operand !== undefined) {
			normalized.push(...Array.isArray(operand.and) ? operand.and : [operand])
		}
	}

	if (normalized.length > 1) {
		return { and: normalized }
	} else if (normalized.length === 1) {
		return normalized[0]
	} else if (hasAlways) {
		return true
	} else {
		return {}
	}
}

export const optimizeNot = <P extends object>(operand: P | boolean): { not: P } | boolean => {
	return typeof operand === 'boolean' ? !operand : { not: operand }
}