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
	const callbackRef = useRef(callback); callbackRef.current = callback
	const lastTimeStamp = useRef<number>(0)

	useLayoutEffect(() => {
		const element = unwrapRefValue(refOrElement)
		if (!element) {
			return
		}
		if (!(element instanceof HTMLElement)) {
			throw new Error('Exhaustive error: Expecting element to be instance of HTMLElement')
		}

		let timeoutID: number | undefined = undefined

		function debouncedOnChange([entry]: ResizeObserverEntry[]) {
			const timeStamp = Date.now()
			const delta = timeStamp - lastTimeStamp.current

			clearTimeout(timeoutID)
			const timeoutFinal = delta > timeout ? 0 : timeout

			timeoutID = setTimeout(() => {
				const message = timeoutFinal > 0 ? 'element.resize:debounced' : 'element.resize:immediate'
				scopedConsoleRef.current.warned(message, null)
				callbackRef.current(entry)
				lastTimeStamp.current = timeStamp
			}, timeoutFinal)
		}

		const resizeObserver = new ResizeObserver(debouncedOnChange)

		resizeObserver.observe(element, { box })

		return () => {
			clearTimeout(timeoutID)
			resizeObserver.unobserve(element)
		}
	}, [box, refOrElement, scopedConsoleRef, timeout])
}
