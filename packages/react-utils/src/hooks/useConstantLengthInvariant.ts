import { usePreviousValue } from './usePreviousValue'

// This entire hook should get optimized away for prod
export const useConstantLengthInvariant = <Item extends unknown>(items: Item[], message?: string) => {
	if (import.meta.env.DEV) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const previous = usePreviousValue(items)
		if (previous.length !== items.length) {
			throw new Error(
				`Invariant violation: ${
					message || 'Changing the length of an array whose length must remain constant between renders.'
				}`,
			)
		}
	}
}
