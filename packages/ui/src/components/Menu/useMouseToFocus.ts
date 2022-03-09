import { RefObject, useEffect } from 'react'
import { useMouseMoveContext } from '../../auxiliary'

export function useMouseToFocus({
  listItemRef,
  listItemTitleRef,
  tabIndex,
}: {
  listItemRef: RefObject<HTMLLIElement>,
  listItemTitleRef: RefObject<HTMLDivElement>,
  tabIndex: number,
}) {
  const mouseIsMoving = useMouseMoveContext()

	useEffect(() => {
		if (tabIndex < -1 || !listItemTitleRef.current || !listItemRef.current) {
			return
		}

		const liRef = listItemRef.current
		const titleRef = listItemTitleRef.current

		const mouseOverListener = (event: MouseEvent) => {
			if (event.defaultPrevented || !mouseIsMoving.current || liRef === document.activeElement) {
				return
			}

			liRef.focus()
			event.preventDefault()
		}

		const mouseOutListener = (event: MouseEvent) => {
			liRef.blur()
		}

		titleRef.addEventListener('mouseover', mouseOverListener)
		titleRef.addEventListener('mouseout', mouseOutListener)

		return () => {
			titleRef.removeEventListener('mouseover', mouseOverListener)
			titleRef.removeEventListener('mouseout', mouseOutListener)
		}
	}, [listItemRef, listItemTitleRef, mouseIsMoving, tabIndex])
}
