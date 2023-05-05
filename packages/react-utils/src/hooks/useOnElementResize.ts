import { useLayoutEffect, useRef } from 'react'
import { useScopedConsoleRef } from '../debug-context'
import { RefObjectOrElement, unwrapRefValue } from './unwrapRefValue'

export function useOnElementResize(
	refOrElement: RefObjectOrElement<HTMLElement | null> | null,
	callback: (entries: ResizeObserverEntry) => void,
	options: ResizeObserverOptions = {},
	timeout: number = 300,
): void {
	const scopedConsoleRef = useScopedConsoleRef('useOnElementResize')

	const { box = 'border-box' } = options
	const element = unwrapRefValue(refOrElement)
	const callbackRef = useRef(callback); callbackRef.current = callback
	const lastTimeStamp = useRef<number>(0)

	useLayoutEffect(() => {
		let timeoutID: number | undefined = undefined

		function debouncedOnChange([entry]: ResizeObserverEntry[]) {
			const timeStamp = Date.now()
			const delta = timeStamp - lastTimeStamp.current

			if (delta > timeout) {
				scopedConsoleRef.current.warned('element.resize:immediate', null)
				callbackRef.current(entry)
				lastTimeStamp.current = timeStamp
			} else {
				clearTimeout(timeoutID)
				timeoutID = setTimeout(() => {
					scopedConsoleRef.current.warned('element.resize:debounced', null)
					callbackRef.current(entry)
					lastTimeStamp.current = timeStamp
				}, timeout)
			}
		}

		if (element instanceof HTMLElement) {
			const resizeObserver = new ResizeObserver(debouncedOnChange)

			resizeObserver.observe(element, { box })

			return () => {
				clearTimeout(timeoutID)
				resizeObserver.unobserve(element)
			}
		} else if (element) {
			throw new Error('Exhaustive error: Expecting element to be instance of HTMLElement')
		}
	}, [box, element, scopedConsoleRef, timeout])
}
