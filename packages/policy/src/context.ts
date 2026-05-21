import { EvaluationContext } from './types'

/**
 * Read a dot-path from the evaluation context. Returns undefined when any
 * segment is missing or when the path tries to traverse a non-object.
 *
 * Array indices are supported (`foo.0.bar`). Empty path returns the root.
 *
 * Note: keys containing a literal `.` are NOT addressable — the dot splits the
 * path. Policy authors should design context shapes around this constraint.
 */
export function readPath(context: EvaluationContext, path: string): unknown {
	if (path === '') {
		return context
	}
	const segments = path.split('.')
	let current: unknown = context
	for (const segment of segments) {
		if (current === null || current === undefined) {
			return undefined
		}
		if (typeof current !== 'object') {
			return undefined
		}
		// Never step into prototype machinery — a path like `__proto__.x` or
		// `constructor` must resolve to undefined, not the prototype/constructor
		// object. Only own enumerable-or-not properties are addressable.
		if (segment === '__proto__' || segment === 'constructor' || segment === 'prototype') {
			return undefined
		}
		if (!Object.prototype.hasOwnProperty.call(current, segment)) {
			return undefined
		}
		current = (current as Record<string, unknown>)[segment]
	}
	return current
}

const SUBST_RE = /\$\{([a-zA-Z0-9_.]+)\}/g
const PLACEHOLDER_RE = /\$\{[a-zA-Z0-9_.]+\}/

/**
 * Substitute `${path}` placeholders in a string against the evaluation context.
 * If a placeholder resolves to undefined, the placeholder is left intact —
 * callers can interpret that as "missing context" and fail-closed.
 *
 * Non-string values are stringified via String().
 */
export function substituteString(value: string, context: EvaluationContext): string {
	return value.replace(SUBST_RE, (full, path: string) => {
		const resolved = readPath(context, path)
		if (resolved === undefined || resolved === null) {
			return full
		}
		return String(resolved)
	})
}

/**
 * Substitute placeholders within an arbitrary condition value. Arrays are mapped
 * element-wise; objects are returned as-is (we don't recurse into nested objects
 * within condition values).
 */
export function substituteValue(value: unknown, context: EvaluationContext): unknown {
	if (typeof value === 'string') {
		return substituteString(value, context)
	}
	if (Array.isArray(value)) {
		return value.map(v => substituteValue(v, context))
	}
	return value
}

/**
 * Returns true iff the value still contains a `${path}` placeholder after
 * substitution — i.e. the caller's context didn't carry the referenced field.
 * Used by `evaluateConditions` to propagate "missing" through to effect-aware
 * fail-closed handling, so a deny like `stringEquals: { 'x': '${y}' }` still
 * fires when `y` is absent (rather than comparing actual to a literal `${y}`).
 */
export function hasUnresolvedPlaceholder(value: unknown): boolean {
	if (typeof value === 'string') {
		return PLACEHOLDER_RE.test(value)
	}
	if (Array.isArray(value)) {
		for (const v of value) {
			if (hasUnresolvedPlaceholder(v)) {
				return true
			}
		}
		return false
	}
	return false
}
