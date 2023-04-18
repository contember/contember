import { RefObject } from 'react'

export type RefObjectOrElement<T> = T | RefObject<T>

/**
 * Unwraps a ref object or returns the value if it is not a ref object.
 * @param value Value to unwrap
 * @returns Unwrapped value
 */
export function unwrapRefValue<T>(value: RefObjectOrElement<T>): T | null {
	if (value && typeof value === 'object' && 'current' in value) {
		return value.current
	} else {
		return value
	}
}
