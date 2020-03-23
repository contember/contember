import * as React from 'react'
import { useConstantLengthInvariant } from './useConstantLengthInvariant'

/**
 * ⚠️ ONLY USE THIS IF YOU *REALLY* KNOW WHAT YOU'RE DOING! ⚠️
 *
 * This is a bit of React naughtiness that allows to memoize outputs of Array.prototype.map() based on the contents
 * of the original array, and not its referential equality. That way, if we create a new array with identical items,
 * we get an array that is referentially equal to the previous one.
 */
export const useArrayMapMemo = <Item, OutputItem>(
	items: Item[],
	map: (value: Item, index: number, array: Item[]) => OutputItem,
): OutputItem[] => {
	useConstantLengthInvariant(items)

	// eslint-disable-next-line react-hooks/exhaustive-deps
	return React.useMemo(() => items.map(map), [map, ...items])
}
