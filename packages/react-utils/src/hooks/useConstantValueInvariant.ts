import { usePreviousValue } from './usePreviousValue'

// This entire hook should get optimized away for prod
export const useConstantValueInvariant = <Value extends unknown>(value: Value, message?: string) => {
	if (import.meta.env.DEV) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const previous = usePreviousValue(value)
		if (previous !== value) {
			throw new Error(
				`Invariant violation: ${message || 'Changing a value which must remain constant between renders.'}`,
			)
		}
	}
}
