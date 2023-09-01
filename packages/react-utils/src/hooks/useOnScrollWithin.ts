import { useLayoutEffect, useRef } from 'react'
import { useScopedConsoleRef } from '../debug-context'
import { RefObjectOrElement, unwrapRefValue } from './unwrapRefValue'

/**
 * Invokes callback on scroll event within the scroll container
 *
 * @param refOrElement - Scroll container
 * @param callback - Callback that is invoked on scroll event
 * @param interval - Specifies how often should scroll event invoke callback
 */
export function useOnScrollWithin(
	refOrElement: RefObjectOrElement<HTMLElement | null> | null,
	callback: (event: Event) => void,
	interval: number = 1000 / 60,
) {
	const scopedConsoleRef = useScopedConsoleRef('useOnScrollWithin')

	const callbackRef = useRef(callback); callbackRef.current = callback
	const lastTimeStamp = useRef<number>(0)

	useLayoutEffect(() => {
		const element = unwrapRefValue(refOrElement)

		let timeoutID: number | undefined = undefined

		if (element) {
			function debouncedHandler(event: Event) {
				clearTimeout(timeoutID)

				const delta = event.timeStamp - lastTimeStamp.current
				scopedConsoleRef.current.logged('event:element.scroll:delta', delta)

				if (delta > interval) {
					scopedConsoleRef.current.warned('event:element.scroll:immediately', event)
					callbackRef.current(event)
					lastTimeStamp.current = event.timeStamp
				} else {
					timeoutID = setTimeout(() => {
						scopedConsoleRef.current.warned('event:element.scroll:debounced', event)
						lastTimeStamp.current = event.timeStamp
						callbackRef.current(event)
					}, interval)
				}
			}

			if (element instanceof HTMLElement) {
				if (element instanceof HTMLBodyElement || element instanceof HTMLHtmlElement) {
					window.addEventListener('scroll', debouncedHandler, { capture: true, passive: true })
					window.addEventListener('resize', debouncedHandler)

					return () => {
						window.removeEventListener('scroll', debouncedHandler)
						window.removeEventListener('resize', debouncedHandler)
					}
				} else {
					element.addEventListener('scroll', debouncedHandler, { passive: true, capture: true })

					return () => {
						element.removeEventListener('scroll', debouncedHandler)
					}
				}
			} else {
				throw new Error('Exhaustive error: Expecting element to be instance of HTMLElement')
			}
		}
	}, [interval, refOrElement, scopedConsoleRef])
}
