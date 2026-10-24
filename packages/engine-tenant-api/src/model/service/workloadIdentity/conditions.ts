import { WorkloadIdentity } from '../../type/index.js'
import { ClaimType, workloadProfiles } from './profiles.js'

export interface ConditionError {
	readonly index: number | null
	readonly message: string
}

export type ParseConditionsResult =
	| { readonly ok: true; readonly conditions: readonly WorkloadIdentity.Condition[] }
	| { readonly ok: false; readonly errors: readonly ConditionError[] }

const OPERATORS = ['equals', 'in', 'startsWith', 'arrayContains'] as const

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const parseTarget = (value: Record<string, unknown>): WorkloadIdentity.ConditionTarget | string => {
	const hasClaim = 'claim' in value
	const hasPath = 'path' in value
	if (hasClaim === hasPath) {
		return 'exactly one of `claim` or `path` is required'
	}
	if (hasClaim) {
		return typeof value.claim === 'string' && value.claim !== '' ? { claim: value.claim } : '`claim` must be a non-empty string'
	}
	const path = value.path
	if (!Array.isArray(path) || path.length === 0 || !path.every((it): it is string => typeof it === 'string' && it !== '')) {
		return '`path` must be a non-empty array of non-empty strings'
	}
	return { path }
}

const parseOperator = (value: Record<string, unknown>): WorkloadIdentity.ConditionOperator | string => {
	const present = OPERATORS.filter(it => it in value)
	if (present.length !== 1) {
		return 'exactly one operator of `equals`, `in`, `startsWith`, `arrayContains` is required'
	}
	const [operator] = present
	switch (operator) {
		case 'equals': {
			const operand = value.equals
			return typeof operand === 'string' || typeof operand === 'number' || typeof operand === 'boolean'
				? { equals: operand }
				: '`equals` must be a string, a number or a boolean'
		}
		case 'in': {
			const operand = value.in
			if (!Array.isArray(operand) || operand.length === 0) {
				return '`in` must be a non-empty array'
			}
			const values: (string | number)[] = []
			for (const it of operand) {
				if (typeof it !== 'string' && typeof it !== 'number') {
					return '`in` values must be strings or numbers'
				}
				values.push(it)
			}
			return { in: values }
		}
		case 'startsWith':
			return typeof value.startsWith === 'string' && value.startsWith !== ''
				? { startsWith: value.startsWith }
				: '`startsWith` must be a non-empty string'
		case 'arrayContains':
			return typeof value.arrayContains === 'string' ? { arrayContains: value.arrayContains } : '`arrayContains` must be a string'
	}
}

/** Parses the untrusted condition list structurally; profile rules are {@link validateConditionsForProfile}. */
export const parseConditions = (input: unknown): ParseConditionsResult => {
	if (!Array.isArray(input) || input.length === 0) {
		return { ok: false, errors: [{ index: null, message: '`conditions` must be a non-empty array' }] }
	}
	const errors: ConditionError[] = []
	const conditions: WorkloadIdentity.Condition[] = []
	input.forEach((item: unknown, index) => {
		if (!isRecord(item)) {
			errors.push({ index, message: 'a condition must be an object' })
			return
		}
		const extra = Object.keys(item).filter(it => it !== 'claim' && it !== 'path' && !(OPERATORS as readonly string[]).includes(it))
		if (extra.length > 0) {
			errors.push({ index, message: `unknown properties: ${extra.join(', ')}` })
			return
		}
		const target = parseTarget(item)
		const operator = parseOperator(item)
		if (typeof target === 'string' || typeof operator === 'string') {
			errors.push(...[target, operator].filter((it): it is string => typeof it === 'string').map(message => ({ index, message })))
			return
		}
		conditions.push({ ...target, ...operator })
	})
	return errors.length > 0 ? { ok: false, errors } : { ok: true, conditions }
}

const operandTypes = (condition: WorkloadIdentity.ConditionOperator): readonly string[] => {
	if ('equals' in condition) {
		return [typeof condition.equals]
	}
	if ('in' in condition) {
		return [...new Set(condition.in.map(it => typeof it))]
	}
	return []
}

const declaredClaimType = (profile: WorkloadIdentity.Profile, condition: WorkloadIdentity.ConditionTarget): ClaimType | undefined => {
	const claimTypes = workloadProfiles[profile].claimTypes
	const name = 'claim' in condition ? condition.claim : condition.path.length === 1 ? condition.path[0] : undefined
	return name !== undefined && Object.prototype.hasOwnProperty.call(claimTypes, name) ? claimTypes[name] : undefined
}

/** The profile rules of §9 / §9b: declared claim types and the mandatory exact `sub` condition. */
export const validateConditionsForProfile = (
	profile: WorkloadIdentity.Profile,
	conditions: readonly WorkloadIdentity.Condition[],
): readonly ConditionError[] => {
	const errors: ConditionError[] = []
	conditions.forEach((condition, index) => {
		const declared = declaredClaimType(profile, condition)
		if (declared === undefined) {
			return
		}
		if ('arrayContains' in condition) {
			errors.push({ index, message: `claim is declared as a ${declared}, \`arrayContains\` can never match it` })
			return
		}
		if ('startsWith' in condition && declared !== 'string') {
			errors.push({ index, message: `claim is declared as a ${declared}, \`startsWith\` can never match it` })
			return
		}
		const mismatched = operandTypes(condition).filter(it => it !== declared)
		if (mismatched.length > 0) {
			errors.push({ index, message: `claim is declared as a ${declared}, an operand of type ${mismatched.join(', ')} can never match it` })
		}
	})
	if (workloadProfiles[profile].requiresExactSubCondition) {
		const hasExactSub = conditions.some(it => 'claim' in it && it.claim === 'sub' && ('equals' in it || 'in' in it))
		if (!hasExactSub) {
			errors.push({ index: null, message: `the ${profile} profile requires a condition on \`sub\` with \`equals\` or \`in\`` })
		}
	}
	return errors
}

export const readClaim = (claims: Readonly<Record<string, unknown>>, target: WorkloadIdentity.ConditionTarget): unknown => {
	if ('claim' in target) {
		return Object.prototype.hasOwnProperty.call(claims, target.claim) ? claims[target.claim] : undefined
	}
	let current: unknown = claims
	for (const segment of target.path) {
		if (!isRecord(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
			return undefined
		}
		current = current[segment]
	}
	return current
}

/** Strict-typed: a type mismatch between operator and claim value is a non-match, never a coercion. */
export const conditionMatches = (condition: WorkloadIdentity.Condition, value: unknown): boolean => {
	if ('equals' in condition) {
		return typeof value === typeof condition.equals && value === condition.equals
	}
	if ('in' in condition) {
		return (typeof value === 'string' || typeof value === 'number') && condition.in.some(it => typeof it === typeof value && it === value)
	}
	if ('startsWith' in condition) {
		return typeof value === 'string' && value.startsWith(condition.startsWith)
	}
	return Array.isArray(value) && value.some(it => typeof it === 'string' && it === condition.arrayContains)
}

/** Index of the first condition the verified claims fail, or `null` when all match. */
export const findFailingCondition = (
	conditions: readonly WorkloadIdentity.Condition[],
	claims: Readonly<Record<string, unknown>>,
): { readonly index: number; readonly actualValue: unknown } | null => {
	for (const [index, condition] of conditions.entries()) {
		const value = readClaim(claims, condition)
		if (!conditionMatches(condition, value)) {
			return { index, actualValue: value }
		}
	}
	return null
}
