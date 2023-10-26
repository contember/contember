import { getElementDimensionsCallback, getSizeFromResizeObserverEntryFactory } from '@contember/utilities'
import { useLayoutEffect, useMemo, useState } from 'react'
import { useScopedConsoleRef } from '../debug-context'
import { useReferentiallyStableCallback } from '../referentiallyStable'
import { RefObjectOrElement, unwrapRefValue } from './unwrapRefValue'
import { useOnElementResize } from './useOnElementResize'

export type ElementSize = {
	height: number
	width: number
}

/**
 * Measure HTMLElement
 *
 * @param refOrElement - HTMLElement passed directly or indirectly as RefObject
 * @returns Size vector consisting of width and height properties
 */
export function useElementSize(
	refOrElement: RefObjectOrElement<HTMLElement>,
	options: ResizeObserverOptions = {},
	timeout: number = 300,
): { height: number | undefined, width: number | undefined } {
	const { logged } = useScopedConsoleRef('useElementSize').current

	const { box = 'border-box' } = options
	const getSizeFromResizeObserverEntry = useMemo(() => getSizeFromResizeObserverEntryFactory(box), [box])

	const [width, setWidth] = useState<number | undefined>()
	const [height, setHeight] = useState<number | undefined>()

	logged('dimensions', { width, height })

	const maybeSetNewDimensions = useReferentiallyStableCallback((dimensions: ElementSize) => {
		if (width !== dimensions.width) {
			setWidth(dimensions.width)
		}
		if (height !== dimensions.height) {
			setHeight(dimensions.height)
		}
	})

	useOnElementResize(refOrElement, entry => {
		const dimensions = logged('useOnElementResize => entry:dimensions', getSizeFromResizeObserverEntry(entry))
		maybeSetNewDimensions(dimensions)
	}, { box }, timeout)

	useLayoutEffect(() => {
		const element = unwrapRefValue(refOrElement)
		if (element) {
			getElementDimensionsCallback(element, dimensions => maybeSetNewDimensions(dimensions))
		}
	})

	return { height, width }
}
