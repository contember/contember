import { forwardRef, ReactElement, useLayoutEffect, useRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useComposeRef } from '@contember/react-utils'

export const DataViewHighlightedWithScroll = forwardRef<HTMLDivElement, { children: ReactElement}>((props, ref) => {
	const innerRef = useRef<HTMLDivElement>(null)
	const composeRef = useComposeRef(ref, innerRef)

	const isHighlighted = 'data-highlighted' in props && props['data-highlighted'] !== undefined
	useLayoutEffect(() => {
		if (isHighlighted && innerRef.current) {
			const scrollArea = innerRef.current.closest('[data-radix-scroll-area-viewport]')
			if (scrollArea) {
				let scrollTo = innerRef.current.offsetTop - scrollArea.clientHeight / 2 + innerRef.current.clientHeight / 2
				scrollArea.scrollTo({
					// to center
					top: scrollTo,
					behavior: 'smooth',
				})

			}
		}
	}, [isHighlighted])

	return <Slot ref={composeRef} {...props} />
})
