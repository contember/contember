import { useEffect } from 'react'
import { RefObjectOrElement, unwrapRefValue } from './unwrapRefValue'

/**
 * Calls the callback when the mouse enters the element, but only after a timeout, e.g. for tooltips or dropdown menus.
 *
 * Calls the callback immediately if the mouse is pressed down with `event.type` of `mousedown`. This is useful for
 * dropdown menus, where the user may click on the menu item before the callback is called resulting in the menu
 * opening and closing immediately.
 *
 * @param refOrElement - The element or ref to the element to attach the event listener to.
 * @param callback - The callback to call when the mouse enters the element.
 * @param timeoutMs - The timeout in milliseconds to wait before calling the callback.
 */
export function useOnElementMouseEnterDelayedCallback(
	refOrElement: RefObjectOrElement<HTMLElement>,
	callback: (event: MouseEvent) => void,
	timeoutMs: number = 300,
): void {
	useEffect(() => {
		const refValue = unwrapRefValue(refOrElement)

		if (refValue) {
			let timeoutID: ReturnType<typeof setTimeout> | undefined = undefined

			function handleMouseEnter(event: MouseEvent) {
				clearTimeout(timeoutID)

				timeoutID = setTimeout(() => {
					callback(event)
				}, timeoutMs)
			}

			function handleMouseLeave() {
				clearTimeout(timeoutID)
			}

			function handleMouseDown(event: MouseEvent) {
				clearTimeout(timeoutID)
				callback(event)
			}

			refValue.addEventListener('mouseenter', handleMouseEnter)
			refValue.addEventListener('mouseleave', handleMouseLeave)
			refValue.addEventListener('mousedown', handleMouseDown)

			return () => {
				refValue.removeEventListener('mouseover', handleMouseEnter)
				refValue.removeEventListener('mouseleave', handleMouseLeave)
				refValue.removeEventListener('mousedown', handleMouseDown)
			}
		}
	}, [callback, refOrElement, timeoutMs])
}
