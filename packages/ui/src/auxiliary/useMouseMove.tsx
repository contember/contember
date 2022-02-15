import { createContext, ReactNode, RefObject, useContext, useEffect, useRef, useState } from 'react'

const MouseMoveContext = createContext<boolean>(false)

export function useMouseMoveContext() {
	return useContext(MouseMoveContext)
}

export function useMouseMove<E extends HTMLElement = HTMLElement>(observedElementRef: RefObject<E>) {
  const coordinates = useRef<[number | undefined, number | undefined]>([undefined, undefined])
	const movingTimeout = useRef<number>(0)
	const [mouseIsActive, setMouseIsActive] = useState(false)

  useEffect(() => {
		if (!observedElementRef.current) {
			return
		}

		const element = observedElementRef.current

		const mouseMoveListener = (event: MouseEvent) => {
			const [x, y] = coordinates.current

			if (x && y && (event.x !== x || event.y !== y)) {
				setMouseIsActive(true)

				window.clearTimeout(movingTimeout.current)
				movingTimeout.current = window.setTimeout(() => {
					setMouseIsActive(false)
				}, 300)
			}

			coordinates.current = [event.x, event.y]
		}

		element.addEventListener('mousemove', mouseMoveListener)

		return () => {
			element.removeEventListener('mousemove', mouseMoveListener)
		}
	}, [observedElementRef])

  return mouseIsActive
}

export function MouseMoveProvider<E extends HTMLElement = HTMLElement>({
	elementRef,
	children,
}: {
	elementRef: RefObject<E>,
	children?: ReactNode,
}) {
	const mouseIsMoving = useMouseMove(elementRef)

	return <MouseMoveContext.Provider value={mouseIsMoving}>
		{children}
	</MouseMoveContext.Provider>
}
