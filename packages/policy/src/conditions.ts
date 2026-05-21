import { ConditionBlock, ConditionValue, Effect, EvaluationContext } from './types'
import { hasUnresolvedPlaceholder, readPath, substituteValue } from './context'
import { globMatch } from './glob'

/**
 * Tri-state operator result.
 *
 *   - `true`      → condition holds
 *   - `false`     → condition definitely fails (actual value present but didn't match)
 *   - `'missing'` → cannot decide because the referenced path is undefined/null.
 *                   The engine then resolves it based on statement effect:
 *                   `allow` → treats as no-match (fail-closed allow);
 *                   `deny`  → treats as match (fail-closed deny).
 *
 * Most operators report `'missing'` when actual is undefined. Operators with
 * intentional missing-handling (`exists`, `forAllValues:*`, `forAllKeys:*`)
 * return an explicit boolean.
 */
export type ConditionResult = boolean | 'missing'

export type ConditionOperator = (actual: unknown, expected: unknown) => ConditionResult

const toArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [value]

const equalsOp = (caseSensitive: boolean): ConditionOperator => (actual, expected) => {
	if (actual === undefined || actual === null) {
		return 'missing'
	}
	const expectedValues = toArray(expected)
	const a = caseSensitive ? String(actual) : String(actual).toLowerCase()
	for (const e of expectedValues) {
		if (e === null || e === undefined) {
			continue
		}
		const ev = caseSensitive ? String(e) : String(e).toLowerCase()
		if (ev === a) {
			return true
		}
	}
	return false
}

const likeOp = (caseSensitive: boolean): ConditionOperator => (actual, expected) => {
	if (actual === undefined || actual === null) {
		return 'missing'
	}
	const expectedValues = toArray(expected)
	const a = caseSensitive ? String(actual) : String(actual).toLowerCase()
	for (const e of expectedValues) {
		if (e === null || e === undefined) {
			continue
		}
		const ev = caseSensitive ? String(e) : String(e).toLowerCase()
		if (globMatch(ev, a)) {
			return true
		}
	}
	return false
}

const numericCmp = (cmp: (a: number, b: number) => boolean): ConditionOperator => (actual, expected) => {
	if (actual === undefined || actual === null) {
		return 'missing'
	}
	const actualNum = typeof actual === 'number' ? actual : Number(actual)
	if (!Number.isFinite(actualNum)) {
		return false
	}
	const expectedValues = toArray(expected)
	for (const e of expectedValues) {
		const en = typeof e === 'number' ? e : Number(e)
		if (Number.isFinite(en) && cmp(actualNum, en)) {
			return true
		}
	}
	return false
}

/**
 * Negative variant of a positive operator. Semantics: "actual differs from
 * every expected value, given actual is defined". When actual is missing,
 * propagates `'missing'` — the engine decides based on effect.
 */
const negateOp = (op: ConditionOperator): ConditionOperator => (actual, expected) => {
	if (actual === undefined || actual === null) {
		return 'missing'
	}
	const result = op(actual, expected)
	if (result === 'missing') {
		return 'missing'
	}
	return !result
}

const dateCmp = (cmp: (a: number, b: number) => boolean): ConditionOperator => (actual, expected) => {
	if (actual === undefined || actual === null) {
		return 'missing'
	}
	const actualMs = parseDate(actual)
	if (actualMs === undefined) {
		return false
	}
	const expectedValues = toArray(expected)
	for (const e of expectedValues) {
		const em = parseDate(e)
		if (em !== undefined && cmp(actualMs, em)) {
			return true
		}
	}
	return false
}

/**
 * Parse a date for the `date*` operators. Accepts `Date`, epoch numbers, and
 * strings.
 *
 * Strings should be ISO 8601 — `Date.parse` is implementation-defined for
 * non-ISO formats (locale-dependent ordering, RFC-2822 quirks), so ambiguous
 * inputs like `"05/18/2026"` will parse differently across runtimes. Policy
 * authors should always use ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`).
 */
const parseDate = (value: unknown): number | undefined => {
	if (value instanceof Date) {
		return value.getTime()
	}
	if (typeof value === 'number') {
		return value
	}
	if (typeof value === 'string') {
		const parsed = Date.parse(value)
		return Number.isNaN(parsed) ? undefined : parsed
	}
	return undefined
}

/**
 * Parse a value into a strict boolean. Accepts the booleans `true`/`false` and
 * exactly the strings `'true'`/`'false'`. Anything else (numbers, other strings,
 * objects) returns `undefined` so the caller can fail-closed rather than
 * silently coercing — e.g. `'no'`, `0`, `{}` should NOT be treated as `false`.
 */
const parseBool = (value: unknown): boolean | undefined => {
	if (value === true || value === 'true') return true
	if (value === false || value === 'false') return false
	return undefined
}

const boolOp: ConditionOperator = (actual, expected) => {
	if (actual === undefined || actual === null) {
		return 'missing'
	}
	const actualBool = parseBool(actual)
	if (actualBool === undefined) {
		return false
	}
	const expectedValues = toArray(expected)
	for (const e of expectedValues) {
		const eb = parseBool(e)
		if (eb !== undefined && eb === actualBool) {
			return true
		}
	}
	return false
}

/**
 * forAllValues — value at path (must be array) where every element matches one
 * of expected values. Vacuous-truth on absent path or empty array — needed so
 * absence-of-data passes, parallel to a `.every()` over a missing collection.
 */
const forAllValuesEquals = (caseSensitive: boolean): ConditionOperator => (actual, expected) => {
	if (actual === undefined || actual === null) {
		return true
	}
	if (!Array.isArray(actual)) {
		return false
	}
	if (actual.length === 0) {
		return true
	}
	const expectedValues = toArray(expected).map(e => caseSensitive ? String(e) : String(e).toLowerCase())
	const expectedSet = new Set(expectedValues)
	for (const item of actual) {
		const i = caseSensitive ? String(item) : String(item).toLowerCase()
		if (!expectedSet.has(i)) {
			return false
		}
	}
	return true
}

/**
 * forAnyValue — value at path (must be array) where at least one element matches
 */
const forAnyValueEquals = (caseSensitive: boolean): ConditionOperator => (actual, expected) => {
	if (actual === undefined || actual === null) {
		return 'missing'
	}
	if (!Array.isArray(actual)) {
		return false
	}
	const expectedValues = toArray(expected).map(e => caseSensitive ? String(e) : String(e).toLowerCase())
	const expectedSet = new Set(expectedValues)
	for (const item of actual) {
		const i = caseSensitive ? String(item) : String(item).toLowerCase()
		if (expectedSet.has(i)) {
			return true
		}
	}
	return false
}

/**
 * forAllValues:stringNotEquals — every element in `actual` differs from all
 * expected values. Vacuous on absent path / empty array.
 */
const forAllValuesNotEquals = (caseSensitive: boolean): ConditionOperator => (actual, expected) => {
	if (actual === undefined || actual === null) {
		return true
	}
	if (!Array.isArray(actual)) {
		return false
	}
	if (actual.length === 0) {
		return true
	}
	const expectedValues = toArray(expected).map(e => caseSensitive ? String(e) : String(e).toLowerCase())
	const expectedSet = new Set(expectedValues)
	for (const item of actual) {
		const i = caseSensitive ? String(item) : String(item).toLowerCase()
		if (expectedSet.has(i)) {
			return false
		}
	}
	return true
}

/**
 * forAnyValue:stringNotEquals — at least one element in `actual` is outside the
 * expected set. Useful for allowlist guards: "deny if any element falls
 * outside the allowed list". Missing path → 'missing' (mirrors `forAnyValue:stringEquals`).
 */
const forAnyValueNotEquals = (caseSensitive: boolean): ConditionOperator => (actual, expected) => {
	if (actual === undefined || actual === null) {
		return 'missing'
	}
	if (!Array.isArray(actual)) {
		return false
	}
	const expectedValues = toArray(expected).map(e => caseSensitive ? String(e) : String(e).toLowerCase())
	const expectedSet = new Set(expectedValues)
	for (const item of actual) {
		const i = caseSensitive ? String(item) : String(item).toLowerCase()
		if (!expectedSet.has(i)) {
			return true
		}
	}
	return false
}

/**
 * forAllKeys — object at path where every property key is in the expected set.
 * Absent path or empty object pass vacuously. Used to constrain the *shape* of
 * an object — i.e. "subject may only carry these properties".
 */
const forAllKeysEquals = (caseSensitive: boolean): ConditionOperator => (actual, expected) => {
	if (actual === undefined || actual === null) {
		return true
	}
	if (typeof actual !== 'object' || Array.isArray(actual)) {
		return false
	}
	const expectedValues = toArray(expected).map(e => caseSensitive ? String(e) : String(e).toLowerCase())
	const expectedSet = new Set(expectedValues)
	for (const key of Object.keys(actual)) {
		const k = caseSensitive ? key : key.toLowerCase()
		if (!expectedSet.has(k)) {
			return false
		}
	}
	return true
}

const numericEqualsOp = numericCmp((a, b) => a === b)

export const defaultOperators: Record<string, ConditionOperator> = {
	stringEquals: equalsOp(true),
	stringEqualsIgnoreCase: equalsOp(false),
	stringNotEquals: negateOp(equalsOp(true)),
	stringLike: likeOp(true),
	stringNotLike: negateOp(likeOp(true)),
	numericEquals: numericEqualsOp,
	numericNotEquals: negateOp(numericEqualsOp),
	numericLessThan: numericCmp((a, b) => a < b),
	numericLessThanEquals: numericCmp((a, b) => a <= b),
	numericGreaterThan: numericCmp((a, b) => a > b),
	numericGreaterThanEquals: numericCmp((a, b) => a >= b),
	dateLessThan: dateCmp((a, b) => a < b),
	dateLessThanEquals: dateCmp((a, b) => a <= b),
	dateGreaterThan: dateCmp((a, b) => a > b),
	dateGreaterThanEquals: dateCmp((a, b) => a >= b),
	bool: boolOp,
	'forAllValues:stringEquals': forAllValuesEquals(true),
	'forAnyValue:stringEquals': forAnyValueEquals(true),
	'forAllValues:stringNotEquals': forAllValuesNotEquals(true),
	'forAnyValue:stringNotEquals': forAnyValueNotEquals(true),
	'forAllKeys:stringEquals': forAllKeysEquals(true),

	exists: (actual, expected) => {
		const wantExists = toArray(expected).some(e => e === true || e === 'true')
		const isExisting = actual !== undefined && actual !== null
		return isExisting === wantExists
	},
}

export interface ConditionContext {
	context: EvaluationContext
	operators: Record<string, ConditionOperator>
}

/**
 * Evaluate a condition block. All operators must pass; within an operator,
 * all path/value pairs must pass.
 *
 * `effect` selects how to handle operators that returned `'missing'`:
 *   - `allow` (default): missing → condition does NOT hold (statement won't apply)
 *   - `deny`           : missing → condition DOES hold (fail-closed; deny fires)
 *
 * The engine always passes `stmt.effect`; the default is set for backward-compat
 * with callers that evaluate conditions outside of an engine context.
 */
export function evaluateConditions(block: ConditionBlock | undefined, ctx: ConditionContext, effect: Effect = 'allow'): boolean {
	if (!block) {
		return true
	}
	for (const [operatorName, paths] of Object.entries(block)) {
		// Guard against inherited members (`toString`, `constructor`, `__proto__`,
		// …): a plain `ctx.operators[operatorName]` walks the prototype chain, so
		// `toString` would resolve to `Object.prototype.toString` and be invoked as
		// an operator — returning a truthy value and silently passing the
		// condition. Only own, function-valued operators are accepted.
		const operator = Object.prototype.hasOwnProperty.call(ctx.operators, operatorName)
			? ctx.operators[operatorName]
			: undefined
		if (typeof operator !== 'function') {
			throw new UnknownConditionOperatorError(operatorName)
		}
		for (const [path, rawExpected] of Object.entries(paths)) {
			const actual = readPath(ctx.context, path)
			const expected = substituteValue(rawExpected, ctx.context) as ConditionValue
			// A residual `${...}` in `expected` after substitution means the caller's
			// context didn't carry a referenced field. Treat as 'missing' so deny
			// still fail-closes — otherwise the operator would compare actual to a
			// literal `${path}` and silently return false.
			if (hasUnresolvedPlaceholder(expected)) {
				if (effect === 'deny') {
					continue
				}
				return false
			}
			const result = operator(actual, expected)
			if (result === 'missing') {
				if (effect === 'deny') {
					continue
				}
				return false
			}
			if (!result) {
				return false
			}
		}
	}
	return true
}

export class UnknownConditionOperatorError extends Error {
	constructor(public readonly operator: string) {
		super(`Unknown condition operator: ${operator}`)
		this.name = 'UnknownConditionOperatorError'
	}
}
