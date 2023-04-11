import deepEqual from 'deep-equal'
import { useRef } from 'react'

// TODO: Unify error behavior with useConstantValueInvariant() and maybe merge into one hook.
export function useExpectSameValueReference<T>(next: T, shouldThrow: boolean = false) {
	const previous = useRef(next)

	if (next !== previous.current
		&& typeof next === 'object'
		&& typeof previous.current === 'object'
		&& deepEqual(next, previous.current)
	) {
		if (import.meta.env.DEV) {
			console.error('Previous and next next do not match in reference although match in value', {
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
