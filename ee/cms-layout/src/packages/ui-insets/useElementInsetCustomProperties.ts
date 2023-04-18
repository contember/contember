import { CSSProperties, RefObject, useMemo } from 'react'
import { trimString } from '../string-utilities'
import { screenInsetsToCSSCustomProperties } from './Helpers'
import { useElementInsets } from './useElementInsets'

export function useElementInsetCustomProperties(
	elementRef: RefObject<HTMLElement>,
	prefix: string = 'container-inset',
): CSSProperties | undefined {
	const elementInsets = useElementInsets(elementRef)

	return useMemo(() => screenInsetsToCSSCustomProperties(
		elementInsets,
		`--${trimString(prefix, '-')}-`,
	), [prefix, elementInsets])
}
