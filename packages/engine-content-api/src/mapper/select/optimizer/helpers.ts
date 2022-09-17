const { optimizeAnd: _optimizeAnd } = require('@contember/engine-content-api-native')

export const optimizeOr = <P extends Record<string, unknown>>(operands: readonly (P | boolean | undefined)[]): P | { or?: P[] } | boolean => {
	const normalized: P[] = []
	let hasNever = false
	for (const operand of operands) {
		if (operand === true) {
			return true
		} else if (operand === false) {
			hasNever = true
		} else if (operand !== undefined)  {
			normalized.push(...Array.isArray(operand.or) ? operand.or : [operand])
		}
	}

	if (normalized.length > 1) {
		return { or: normalized }
	} else if (normalized.length === 1) {
		return normalized[0]
	} else if (hasNever) {
		return false
	} else {
		return {}
	}
}

export const optimizeAnd = <P extends Record<string, unknown>>(operands: readonly (P | boolean | undefined)[]): P | { and?: P[] } | boolean => {
	return _optimizeAnd(operands)
}

export const optimizeNot = <P extends Record<string, unknown>>(operand: P | boolean): P['not'] | { not: P } | boolean => {
	if (typeof operand === 'boolean') {
		return !operand
	} else if (operand.not) {
		return operand.not as P['not']
	} else {
		return { not: operand }
	}
}
