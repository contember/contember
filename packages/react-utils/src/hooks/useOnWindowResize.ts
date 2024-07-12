import { useLayoutEffect, useRef } from 'react'
import { useScopedConsoleRef } from '../debug-context'

export function useOnWindowResize(
	callback: (event: Event) => void,
	interval: number = 300,
) {
	const scopedConsoleRef = useScopedConsoleRef('useOnWindowResize')

	const callbackRef = useRef(callback); callbackRef.current = callback
	const lastTimeStamp = useRef<number>(0)

	useLayoutEffect(() => {
		let timeoutID: number | undefined = undefined

		function debouncedHandler(event: Event) {
			clearTimeout(timeoutID)

			const delta = event.timeStamp - lastTimeStamp.current
			scopedConsoleRef.current.logged('window.resize:delta', delta)

			if (delta > interval) {
				scopedConsoleRef.current.warned('event:window.resize:immediately', null)
				callbackRef.current(event)
				lastTimeStamp.current = event.timeStamp
			} else {
				timeoutID = setTimeout(() => {
					scopedConsoleRef.current.warned('event:window.resize:debounced', null)
					lastTimeStamp.current = event.timeStamp
					callbackRef.current(event)
				}, interval)
			}
		}

		window.addEventListener('resize', debouncedHandler)

		return () => {
			clearTimeout(timeoutID)
			window.removeEventListener('resize', debouncedHandler)
		}
	}, [callbackRef, interval, scopedConsoleRef])
}
