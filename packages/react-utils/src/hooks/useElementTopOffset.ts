import { RefObject, useLayoutEffect, useState } from 'react'

export function useElementTopOffset(ref?: RefObject<HTMLElement>): number | undefined {
	const [offsetTop, setOffsetTop] = useState<number | undefined>(undefined)

	useLayoutEffect(() => {
		if (!ref?.current) {
			return
		}

		const element = ref.current

		function updateTopOffsetCallback() {
			setOffsetTop(element.offsetTop)
		}

		function updateTopOffsetHandler() {
			requestAnimationFrame(updateTopOffsetCallback)
		}

		updateTopOffsetHandler()

		const observer = new ResizeObserver(() => {
			requestAnimationFrame(updateTopOffsetCallback)
		})

		observer.observe(element)

		return () => {
			observer.unobserve(element)
		}
	}, [ref])

	return offsetTop
}
