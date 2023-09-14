import { deprecate } from '@contember/utilities'
import { createContext, ReactNode, RefObject, useContext, useEffect, useRef } from 'react'

const MouseMoveContext = createContext<RefObject<boolean>>({ current: false })

/** @deprecated No alternative since 1.4.0 */
export function useMouseMoveContext() {
	deprecate('1.4.0', true, 'useMouseMoveContext', null)
	return useContext(MouseMoveContext)
}

/** @deprecated No alternative since 1.4.0 */
export function useMouseMove<E extends HTMLElement = HTMLElement>(observedElementRef: RefObject<E>): RefObject<boolean> {
	deprecate('1.4.0', true, 'useMouseMove', null)
	const movingTimeout = useRef<number>(0)
	const mouseActive = useRef(false)

	useEffect(() => {
		if (!observedElementRef.current) {
			return
		}

		const element = observedElementRef.current

		const mouseMoveListener = () => {
			mouseActive.current = true
			window.clearTimeout(movingTimeout.current)
			movingTimeout.current = window.setTimeout(() => {
				mouseActive.current = false
			}, 300)
		}

		element.addEventListener('mousemove', mouseMoveListener)

		return () => {
			element.removeEventListener('mousemove', mouseMoveListener)
		}
	}, [observedElementRef])

	return mouseActive
}

/** @deprecated No alternative since 1.4.0 */
export function MouseMoveProvider<E extends HTMLElement = HTMLElement>({
	elementRef,
	children,
}: {
	elementRef: RefObject<E>,
	children?: ReactNode,
}) {
	deprecate('1.4.0', true, 'MouseMoveProvider', null)
	const mouseIsMoving = useMouseMove(elementRef)

	return (
		<MouseMoveContext.Provider value={mouseIsMoving}>
			{children}
		</MouseMoveContext.Provider>
	)
}
