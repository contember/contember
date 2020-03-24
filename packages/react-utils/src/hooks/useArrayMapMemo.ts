import * as React from 'react'
import { useConstantLengthInvariant } from './useConstantLengthInvariant'

/**
 * ⚠️ ONLY USE THIS IF YOU *REALLY* KNOW WHAT YOU'RE DOING! ⚠️
 * ⚠ HERE BE DRAGONS THAT CAN TELL DAN ABRAMOV WHERE YOU LIVE! ⚠
 *
 * This is a bit of React naughtiness that allows us to memoize outputs of Array.prototype.map() based on the contents
 * of the original array, and not its referential equality. That way, if we create a new array with identical items,
 * we get an array that is referentially equal to the previous one.
 */
export const useArrayMapMemo = <Item, OutputItem>(
	items: Item[],
	map: (value: Item, index: number, array: Item[]) => OutputItem,
): OutputItem[] => {
	useConstantLengthInvariant(items)

	// This is tricky. We don't want to exclude the map function from the dependency list because if it changes but the
	// items array remains the same, we still want to re-compute the new array. However, if that yields the same array,
	// in the sense that the items are identical, albeit computed via a different map function, we still want to
	// preserve the referential equality of the original. Hence the second memo.

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const mapped = React.useMemo(() => items.map(map), [map, ...items])

	// eslint-disable-next-line react-hooks/exhaustive-deps
	return React.useMemo(() => mapped, mapped) // This is deliberately not `[mapped]`
}
