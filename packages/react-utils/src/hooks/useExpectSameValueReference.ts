import deepEqual from 'deep-equal'
import { useRef } from 'react'

/**
 * Checks whether the next value is the same reference as the previous one
 *
 * If not, it checks whether the values are deeply equal. If not, it logs an error.
 *
 * @param next - Value to be checked.
 * @param shouldThrow - If true, it throws an error instead of logging it. Defaults to false.
 * @returns void
 * -
 * @example
 * ```ts
 * useExpectSameValueReference(style)
 * ```
 * @example
 * ```ts
 * useExpectSameValueReference(style, true)
 * ```
 * @example
 * ```ts
 * useExpectSameValueReference(style, import.meta.env.DEV)
 * ```
 */
export function useExpectSameValueReference<T>(next: T, shouldThrow: boolean = false) {
	const previous = useRef(next)

	if (next !== previous.current
		&& typeof next === 'object'
		&& typeof previous.current === 'object'
		&& deepEqual(next, previous.current)
	) {
		if (import.meta.env.DEV) {
			console.error(
				'Previous and next values do not match in reference although match in value. ' +
				'Try declaring constants outside of the component scope. ' +
				'Otherwise try to memoize callbacks with useCallback, ' +
				'useReferentiallyStableCallback useEvent, useRef or useMemo.', {
				previous: previous.current,
				next,
			})
		}

		if (shouldThrow) {
			throw new Error('Expecting same reference for same values')
		}
	}

	previous.current = next
}
