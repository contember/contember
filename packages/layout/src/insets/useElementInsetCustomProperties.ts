import { CSSProperties, RefObject, useMemo } from 'react'
import { screenInsetsToCSSCustomProperties } from './Helpers'
import { useElementInsets } from './useElementInsets'

export function useElementInsetCustomProperties(
	elementRef: RefObject<HTMLElement>,
	prefix: string = 'inset',
): CSSProperties | undefined {
	const elementInsets = useElementInsets(elementRef)

	return useMemo(() => screenInsetsToCSSCustomProperties(
		elementInsets,
		`--${prefix}`,
	), [prefix, elementInsets])
}
