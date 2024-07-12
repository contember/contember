import { useCallback } from 'react'
import { DataViewHighlightEvent } from '@contember/react-dataview'

export const useOnHighlight = () => {
	return useCallback((event: DataViewHighlightEvent) => {
		const scrollArea = event.element.closest('[data-radix-scroll-area-viewport]')
		if (scrollArea) {
			let scrollTo = event.element.offsetTop - scrollArea.clientHeight / 2 + event.element.clientHeight / 2
			scrollArea.scrollTo({
				// to center
				top: scrollTo,
				behavior: 'smooth',
			})
		}
	}, [])
}
