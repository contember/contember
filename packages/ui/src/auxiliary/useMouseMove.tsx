import { createContext, ReactNode, RefObject, useContext, useEffect, useRef } from 'react'

const MouseMoveContext = createContext<RefObject<boolean>>({ current: false })

export function useMouseMoveContext() {
	return useContext(MouseMoveContext)
}

export function useMouseMove<E extends HTMLElement = HTMLElement>(observedElementRef: RefObject<E>): RefObject<boolean> {
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

export function MouseMoveProvider<E extends HTMLElement = HTMLElement>({
	elementRef,
	children,
}: {
	elementRef: RefObject<E>,
	children?: ReactNode,
}) {
	const mouseIsMoving = useMouseMove(elementRef)

	return (
		<MouseMoveContext.Provider value={mouseIsMoving}>
			{children}
		</MouseMoveContext.Provider>
	)
}
