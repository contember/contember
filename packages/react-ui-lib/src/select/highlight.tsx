import { useCallback } from 'react'
import { DataViewHighlightEvent } from '@contember/react-dataview'

/**
 * `useOnHighlight` is a hook that returns a callback function to handle the highlight event of a data view.
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Usage
 * ```tsx
 * const onHighlight = useOnHighlight()
 * ...
 * <DataView onHighlight={onHighlight} />
 * ```
 *
 * @group SelectInput
 * @group MultiSelectInput
 */
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
