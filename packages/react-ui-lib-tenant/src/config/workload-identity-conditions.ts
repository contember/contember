import { dict } from '../dict.js'

const isRecord = (value: unknown): value is { readonly [key: string]: unknown } =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const operators = ['equals', 'in', 'startsWith', 'arrayContains'] as const

const formatTarget = (condition: { readonly [key: string]: unknown }): string | undefined => {
	const { claim, path } = condition
	if (('claim' in condition) === ('path' in condition)) {
		return undefined
	}
	if (typeof claim === 'string') {
		return claim
	}
	if (Array.isArray(path) && path.length > 0 && path.every((it): it is string => typeof it === 'string')) {
		// Distinct from a dotted claim name: a literal claim key may itself contain dots.
		return path.join(' › ')
	}
	return undefined
}

const formatOperator = (condition: { readonly [key: string]: unknown }): string | undefined => {
	const present = operators.filter(it => it in condition)
	if (present.length !== 1) {
		return undefined
	}
	const labels = dict.tenant.workloadIdentityList.conditionOperators
	const [operator] = present
	switch (operator) {
		case 'equals': {
			const operand = condition.equals
			return typeof operand === 'string' || typeof operand === 'number' || typeof operand === 'boolean'
				? `${labels.equals} ${JSON.stringify(operand)}`
				: undefined
		}
		case 'in': {
			const operand = condition.in
			return Array.isArray(operand) && operand.every(it => typeof it === 'string' || typeof it === 'number')
				? `${labels.in} [${operand.map(it => JSON.stringify(it)).join(', ')}]`
				: undefined
		}
		case 'startsWith':
			return typeof condition.startsWith === 'string' ? `${labels.startsWith} ${JSON.stringify(condition.startsWith)}` : undefined
		case 'arrayContains':
			return typeof condition.arrayContains === 'string' ? `${labels.arrayContains} ${JSON.stringify(condition.arrayContains)}` : undefined
	}
}

/**
 * Renders one stored trust condition (`{ claim } | { path }` plus one operator) as a readable line.
 *
 * The value arrives as a `Json` scalar, so a shape this view does not recognize falls back to its
 * JSON rather than being hidden or misread.
 */
export const formatWorkloadCondition = (condition: unknown): string => {
	if (isRecord(condition)) {
		const target = formatTarget(condition)
		const operator = formatOperator(condition)
		if (target !== undefined && operator !== undefined) {
			return `${target} ${operator}`
		}
	}
	return JSON.stringify(condition)
}

/** The trust's condition list, one line per condition, in the order they were applied. */
export const formatWorkloadConditions = (conditions: unknown): readonly string[] =>
	Array.isArray(conditions) ? conditions.map(formatWorkloadCondition) : [JSON.stringify(conditions)]
