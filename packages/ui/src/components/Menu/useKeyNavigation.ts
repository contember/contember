import {
	KeyboardEventHandler,
	KeyboardEvent as ReactKeyboardEvent,
	RefObject,
	SyntheticEvent,
	useCallback,
} from 'react'
import { useFocusableContext } from './Contexts'

export const useKeyNavigation = ({ changeExpand, expanded, depth, isInteractive, listItemRef, onClick }: {
	onClick: (event: SyntheticEvent) => void
	listItemRef: RefObject<HTMLElement | null>
	isInteractive: boolean
	depth: number
	expanded: boolean
	changeExpand: (value: boolean) => void,
}) => {
	const { nextFocusable, previousFocusable } = useFocusableContext()

	return useCallback<KeyboardEventHandler<HTMLLIElement>>((event: ReactKeyboardEvent<HTMLLIElement>) => {
		if (!listItemRef.current || event.defaultPrevented) {
			return
		}

		if (document.activeElement !== listItemRef.current) {
			if (depth > 0 && event.code === 'ArrowLeft' && expanded) {
				changeExpand(false)
				listItemRef.current.focus()
				event.preventDefault()
			}

			return
		}

		switch (event.code) {
			case 'Enter':
				if (!expanded && isInteractive) {
					changeExpand(true)
				} else {
					onClick(event)
				}
				event.preventDefault()
				break
			case 'Space':
				changeExpand(!expanded)
				event.preventDefault()
				break
			case 'ArrowLeft':
			case 'ArrowUp':
				previousFocusable()?.focus()
				event.preventDefault()
				break
			case 'ArrowRight':
			case 'ArrowDown':
				nextFocusable()?.focus()
				event.preventDefault()
				break
		}
	}, [changeExpand, depth, expanded, isInteractive, listItemRef, nextFocusable, onClick, previousFocusable])
}
